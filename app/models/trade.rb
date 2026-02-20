class Trade < ApplicationRecord
  belongs_to :session
  belongs_to :strategy, optional: true

  validates :asset, presence: true
  validates :direction, presence: true, inclusion: { in: %w[long short] }
  validates :entry_price, presence: true, numericality: { greater_than: 0 }
  validates :quantity, numericality: { greater_than: 0 }, allow_nil: true
  validates :opened_at, presence: true

  before_validation :standardize_asset
  before_validation :set_defaults
  before_validation :calculate_closing_metrics, if: :closing_data_present?

  private

  def standardize_asset
    self.asset = asset.upcase.gsub("/", "") if asset.present?
  end

  def set_defaults
    self.opened_at ||= Time.current
  end

  def closing_data_present?
    close_price.present? && entry_price.present? && direction.present? && quantity.present?
  end

  def calculate_closing_metrics
    price_delta = close_price.to_d - entry_price.to_d
    gross_pnl = (direction == "short" ? -price_delta : price_delta) * quantity.to_d
    net_pnl = gross_pnl - fee.to_d

    self.pnl_gross = gross_pnl.round(2)
    self.pnl_net = net_pnl.round(2)
    self.result =
      if pnl_net.positive?
        "win"
      elsif pnl_net.negative?
        "loss"
      else
        "breakeven"
      end
    self.closed_at ||= Time.current
  end
end
