class CreateWarnings < ActiveRecord::Migration[8.0]
  def change
    create_table :warnings do |t|
      t.references :session, null: false, foreign_key: true
      t.references :trade, null: true, foreign_key: true

      t.string :warning_type, null: false
      t.text :message

      t.datetime :triggered_at, null: false

      t.timestamps
    end

    add_index :warnings, :warning_type
    add_index :warnings, :triggered_at
  end
end
