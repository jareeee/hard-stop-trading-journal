class CreateSessionStrategies < ActiveRecord::Migration[8.0]
  def change
    create_table :session_strategies do |t|
      t.references :session, null: false, foreign_key: true
      t.references :strategy, null: false, foreign_key: true

      t.timestamps
    end

    add_index :session_strategies, [ :session_id, :strategy_id ], unique: true
  end
end
