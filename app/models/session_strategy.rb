class SessionStrategy < ApplicationRecord
  belongs_to :session
  belongs_to :strategy

  validates :session_id, uniqueness: { scope: :strategy_id }
end
