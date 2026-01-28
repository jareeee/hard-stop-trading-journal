class CreateSessions < ActiveRecord::Migration[8.0]
  def change
    create_table :sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :rule, null: true, foreign_key: true

      t.string :status, null: false, default: 'active'  # active / ended
      t.datetime :started_at, null: false
      t.datetime :ended_at

      t.timestamps
    end

    add_index :sessions, :status
    add_index :sessions, :started_at
  end
end
