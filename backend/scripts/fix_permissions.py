"""
FoodChain AI - Fix Database Schema Permissions

This script connects as the database superuser to grant all privileges 
on the public schema to the 'foodchain' user.
"""

import sys
from sqlalchemy import create_engine, text

def main():
    print("==================================================")
    print("🔑 FoodChain AI - Database Permissions Fixer")
    print("==================================================")
    
    print("\nTo grant schema permissions, we need to connect as the database superuser (usually 'postgres').")
    db_user = input("Superuser Username [postgres]: ").strip() or "postgres"
    db_pass = input("Superuser Password: ").strip()
    db_host = input("Database Host [localhost]: ").strip() or "localhost"
    db_port = input("Database Port [5432]: ").strip() or "5432"
    db_name = "foodchain_db"
    
    # Connection URL
    conn_url = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    
    try:
        engine = create_engine(conn_url)
        with engine.connect() as conn:
            # Grant privileges
            print("\n⚙️ Granting schema and database privileges to 'foodchain'...")
            conn.execute(text("GRANT ALL PRIVILEGES ON DATABASE foodchain_db TO foodchain;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO foodchain;"))
            conn.execute(text("ALTER DATABASE foodchain_db OWNER TO foodchain;"))
            conn.execute(text("ALTER SCHEMA public OWNER TO foodchain;"))
            conn.commit()
            print("✅ Privileges granted successfully! 'foodchain' is now the database/schema owner. 🎉")
            sys.exit(0)
    except Exception as e:
        print(f"\n❌ Failed to fix database permissions: {e}")
        print("\nSuggestions:")
        print("1. Make sure you entered the correct password for the superuser.")
        print("2. Ensure the database 'foodchain_db' already exists.")
        print("3. Alternatively, you can open pgAdmin, open a Query Tool on 'foodchain_db', and run:")
        print("   ALTER DATABASE foodchain_db OWNER TO foodchain;")
        print("   GRANT ALL ON SCHEMA public TO foodchain;")
        print("   ALTER SCHEMA public OWNER TO foodchain;")
        sys.exit(1)

if __name__ == "__main__":
    main()
