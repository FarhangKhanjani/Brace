<span className={`price-change ${parseFloat(coin.priceChangePercent) >= 0 ? 'positive' : 'negative'}`}>
  {parseFloat(coin.priceChangePercent) >= 0 ? '+' : ''}
  {parseFloat(coin.priceChangePercent).toFixed(1)}%
</span> 