from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from typing import List
from datetime import datetime
import io
import pandas as pd

from app.database import get_db
from app.models import BTCTrade, User
from app.api.auth import get_current_user
from app.services.btc_gain_calculator import BTCGainCalculator, CostBasisMethod
from pydantic import BaseModel

router = APIRouter()

# Pydantic models
class BTCTradeCreate(BaseModel):
    txid: str | None = None
    amount_btc: float
    counter_value_jpy: float
    jpy_rate: float
    fee_btc: float = 0
    fee_jpy: float = 0
    timestamp: datetime
    exchange: str | None = None
    notes: str | None = None

class BTCTradeResponse(BaseModel):
    id: int
    txid: str | None
    amount_btc: float
    counter_value_jpy: float
    jpy_rate: float
    fee_btc: float
    fee_jpy: float
    timestamp: datetime
    exchange: str | None
    trade_type: str
    notes: str | None
    
    class Config:
        from_attributes = True

class GainCalculationRequest(BaseModel):
    method: CostBasisMethod = CostBasisMethod.FIFO

# Routes
@router.get("/", response_model=List[BTCTradeResponse])
async def get_btc_trades(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all BTC trades"""
    result = await db.execute(
        select(BTCTrade).order_by(BTCTrade.timestamp.desc())
    )
    trades = result.scalars().all()
    
    return [
        BTCTradeResponse(
            id=trade.id,
            txid=trade.txid,
            amount_btc=trade.amount_btc,
            counter_value_jpy=trade.counter_value_jpy,
            jpy_rate=trade.jpy_rate,
            fee_btc=trade.fee_btc,
            fee_jpy=trade.fee_jpy,
            timestamp=trade.timestamp,
            exchange=trade.exchange,
            trade_type="buy" if trade.amount_btc > 0 else "sell",
            notes=trade.notes
        )
        for trade in trades
    ]

@router.post("/", response_model=BTCTradeResponse)
async def create_btc_trade(
    trade_data: BTCTradeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new BTC trade"""
    # Check for duplicate txid
    if trade_data.txid:
        result = await db.execute(
            select(BTCTrade).where(BTCTrade.txid == trade_data.txid)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Trade with txid {trade_data.txid} already exists"
            )
    
    trade = BTCTrade(**trade_data.dict())
    trade.trade_type = "buy" if trade.amount_btc > 0 else "sell"
    
    db.add(trade)
    await db.commit()
    await db.refresh(trade)
    
    return BTCTradeResponse(
        id=trade.id,
        txid=trade.txid,
        amount_btc=trade.amount_btc,
        counter_value_jpy=trade.counter_value_jpy,
        jpy_rate=trade.jpy_rate,
        fee_btc=trade.fee_btc,
        fee_jpy=trade.fee_jpy,
        timestamp=trade.timestamp,
        exchange=trade.exchange,
        trade_type=trade.trade_type,
        notes=trade.notes
    )

@router.post("/{trade_id}/calculate-gain")
async def calculate_gain(
    trade_id: int,
    request: GainCalculationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Calculate realized gain for a sell trade"""
    # Get the trade
    result = await db.execute(
        select(BTCTrade).where(BTCTrade.id == trade_id)
    )
    trade = result.scalar_one_or_none()
    
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    if trade.amount_btc >= 0:
        raise HTTPException(status_code=400, detail="Not a sell trade")
    
    # Calculate gain
    calculator = BTCGainCalculator(db)
    try:
        gain_result = await calculator.calculate_realized_gain(trade, request.method)
        return gain_result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/report/{year}")
async def generate_yearly_report(
    year: int,
    method: CostBasisMethod = CostBasisMethod.FIFO,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate yearly realized gain report"""
    calculator = BTCGainCalculator(db)
    
    try:
        df = await calculator.generate_gain_report(year, method)
        
        # Convert to Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=f'BTC_Gains_{year}', index=False)
            
            # Format the Excel file
            worksheet = writer.sheets[f'BTC_Gains_{year}']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename=btc_gains_{year}_{method.value}.xlsx'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary")
async def get_btc_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get BTC trading summary"""
    # Calculate total BTC holdings
    result = await db.execute(
        select(
            func.sum(BTCTrade.amount_btc).label('total_btc'),
            func.sum(case((BTCTrade.amount_btc > 0, BTCTrade.amount_btc), else_=0)).label('total_bought'),
            func.sum(case((BTCTrade.amount_btc < 0, BTCTrade.amount_btc), else_=0)).label('total_sold'),
            func.avg(case((BTCTrade.amount_btc > 0, BTCTrade.jpy_rate), else_=None)).label('avg_buy_rate')
        )
    )
    summary = result.one()
    
    # Get latest trade
    result = await db.execute(
        select(BTCTrade).order_by(BTCTrade.timestamp.desc()).limit(1)
    )
    latest_trade = result.scalar_one_or_none()
    
    return {
        "total_btc": float(summary.total_btc or 0),
        "total_bought": float(summary.total_bought or 0),
        "total_sold": abs(float(summary.total_sold or 0)),
        "average_buy_rate": float(summary.avg_buy_rate or 0),
        "latest_trade": {
            "date": latest_trade.timestamp.isoformat() if latest_trade else None,
            "type": "buy" if latest_trade and latest_trade.amount_btc > 0 else "sell",
            "rate": latest_trade.jpy_rate if latest_trade else None
        } if latest_trade else None
    }

@router.delete("/{trade_id}")
async def delete_btc_trade(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a BTC trade"""
    result = await db.execute(
        select(BTCTrade).where(BTCTrade.id == trade_id)
    )
    trade = result.scalar_one_or_none()
    
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    await db.delete(trade)
    await db.commit()
    
    return {"message": "Trade deleted successfully"}