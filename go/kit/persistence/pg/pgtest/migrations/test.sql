CREATE SCHEMA IF NOT EXISTS "test";
SET search_path TO test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE test_resource (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    deleted_at timestamp,
    name text NOT NULL,
    dependency_id uuid, -- New column for having dependency id to simulate a tree or graph.
    PRIMARY KEY (id),
    FOREIGN KEY (dependency_id) REFERENCES test_resource(id)
);
