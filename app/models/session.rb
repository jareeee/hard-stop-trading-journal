class Session < ApplicationRecord
  belongs_to :user
  belongs_to :rule, optional: true
  has_many :trades, dependent: :destroy

  validates :status, presence: true, inclusion: { in: %w[active ended] }
  validates :started_at, presence: true

  # Helper to find or create active session for user
  def self.current_for(user)
    user.sessions.where(status: "active").order(created_at: :desc).first
  end
end
