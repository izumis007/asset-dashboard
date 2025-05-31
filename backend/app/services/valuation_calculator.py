# Calculate valuations
        total_jpy = 0.0
        breakdown_by_asset_class = {}  # asset_classに統一
        breakdown_by_currency = {}
        breakdown_by_account_type = {}
        
        # Process holdings
        result = await self.db.execute(
            select(Holding).options(
                selectinload(Holding.asset)
            )
        )
        holdings = result.scalars().all()
        
        for holding in holdings:
            # Get latest price
            price = await self._get_latest_price(holding.asset, target_date)
            if not price:
                logger.warning(f"No price found for {holding.asset.symbol}")
                continue
            
            # Calculate value in asset currency
            value_in_currency = holding.quantity * price
            
            # Convert to JPY
            if holding.asset.currency == "JPY":
                value_jpy = value_in_currency
            else:
                fx_rate = fx_rates.get(f"{holding.asset.currency}/JPY", 0)
                if fx_rate == 0:
                    logger.warning(f"No FX rate for {holding.asset.currency}/JPY")
                    continue
                value_jpy = value_in_currency * fx_rate
            
            # Update totals
            total_jpy += value_jpy
            
            # Update breakdowns
            asset_class = holding.asset.asset_class.value
            breakdown_by_asset_class[asset_class] = breakdown_by_asset_class.get(asset_class, 0) + value_jpy
            
            currency = holding.asset.currency
            breakdown_by_currency[currency] = breakdown_by_currency.get(currency, 0) + value_in_currency
            
            account_type = holding.account_type.value
            breakdown_by_account_type[account_type] = breakdown_by_account_type.get(account_type, 0) + value_jpy