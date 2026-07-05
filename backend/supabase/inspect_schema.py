import json
import os

import psycopg
from dotenv import load_dotenv


def fetch_all(cur, query: str, params: tuple = ()) -> list[dict]:
    cur.execute(query, params)
    columns = [desc.name for desc in cur.description]
    return [dict(zip(columns, row)) for row in cur.fetchall()]


def main() -> None:
    load_dotenv()
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set")

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            tables = fetch_all(
                cur,
                """
                select table_name
                from information_schema.tables
                where table_schema = 'public'
                  and table_type = 'BASE TABLE'
                order by table_name
                """,
            )
            table_names = [row["table_name"] for row in tables]

            columns = fetch_all(
                cur,
                """
                select
                    table_name,
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                from information_schema.columns
                where table_schema = 'public'
                order by table_name, ordinal_position
                """,
            )

            constraints = fetch_all(
                cur,
                """
                select
                    conrelid::regclass::text as table_name,
                    conname as constraint_name,
                    contype as constraint_type,
                    pg_get_constraintdef(oid) as definition
                from pg_constraint
                where connamespace = 'public'::regnamespace
                order by conrelid::regclass::text, contype, conname
                """,
            )

            indexes = fetch_all(
                cur,
                """
                select
                    tablename as table_name,
                    indexname as index_name,
                    indexdef as definition
                from pg_indexes
                where schemaname = 'public'
                order by tablename, indexname
                """,
            )

            policies = fetch_all(
                cur,
                """
                select
                    tablename as table_name,
                    policyname as policy_name,
                    permissive,
                    roles,
                    cmd,
                    qual,
                    with_check
                from pg_policies
                where schemaname = 'public'
                order by tablename, policyname
                """,
            )

            counts = []
            for table_name in table_names:
                cur.execute(f'select count(*) from public."{table_name}"')
                counts.append({"table_name": table_name, "row_count": cur.fetchone()[0]})

    print(
        json.dumps(
            {
                "tables": table_names,
                "columns": columns,
                "constraints": constraints,
                "indexes": indexes,
                "policies": policies,
                "counts": counts,
            },
            indent=2,
            default=str,
        )
    )


if __name__ == "__main__":
    main()
