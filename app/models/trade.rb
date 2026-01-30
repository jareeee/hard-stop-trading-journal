class Trade < ApplicationRecord
  belongs_to :session
  belongs_to :strategy, optional: true

  validates :asset, presence: true
  validates :direction, presence: true, inclusion: { in: %w[long short] }
  validates :entry_price, presence: true, numericality: { greater_than: 0 }
  validates :opened_at, presence: true

  before_validation :standardize_asset
  before_validation :set_defaults

  private

  def standardize_asset
    self.asset = asset.upcase.gsub("/", "") if asset.present?
  end

  def set_defaults
    self.opened_at ||= Time.current
  end
end
