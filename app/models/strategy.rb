class Strategy < ApplicationRecord
  belongs_to :user
  has_many :trades

  validates :name, presence: true, uniqueness: { scope: :user_id }
end
