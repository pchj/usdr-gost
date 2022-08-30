/* eslint-disable func-names */

// This file was generated by generate_arpa_table_migrations.js on 2022-08-22T07:02:02.209Z.
// Describe any manual modifications below:
//  - (none)

exports.up = function (knex) {
    return knex.schema.raw(
        // This SQL generated with the following command:
        // pg_dump postgresql://localhost:5432/usdr_arpa_reporter --schema-only --no-owner --no-privileges --table=projects
        `
            --
            -- PostgreSQL database dump
            --
            
            -- Dumped from database version 14.2
            -- Dumped by pg_dump version 14.2
            
            SET statement_timeout = 0;
            SET lock_timeout = 0;
            SET idle_in_transaction_session_timeout = 0;
            SET client_encoding = 'UTF8';
            SET standard_conforming_strings = on;
            -- Line below commented out by generate_arpa_table_migrations.js because it interferes with Knex
            -- SELECT pg_catalog.set_config('search_path', '', false);
            SET check_function_bodies = false;
            SET xmloption = content;
            SET client_min_messages = warning;
            SET row_security = off;
            
            SET default_tablespace = '';
            
            SET default_table_access_method = heap;
            
            --
            -- Name: projects; Type: TABLE; Schema: public; Owner: -
            --
            
            CREATE TABLE public.projects (
                id integer NOT NULL,
                code text NOT NULL,
                name text NOT NULL,
                agency_id integer,
                status text,
                description text,
                created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
                created_by text,
                updated_at timestamp with time zone,
                updated_by text,
                created_in_period integer,
                tenant_id integer NOT NULL
            );
            
            
            --
            -- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
            --
            
            CREATE SEQUENCE public.projects_id_seq
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;
            
            
            --
            -- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
            --
            
            ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;
            
            
            --
            -- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
            --
            
            ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);
            
            
            --
            -- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
            --
            
            ALTER TABLE ONLY public.projects
                ADD CONSTRAINT projects_pkey PRIMARY KEY (id);
            
            
            --
            -- Name: projects projects_tenant_id_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
            --
            
            ALTER TABLE ONLY public.projects
                ADD CONSTRAINT projects_tenant_id_code_unique UNIQUE (tenant_id, code);
            
            
            --
            -- Name: projects projects_tenant_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
            --
            
            ALTER TABLE ONLY public.projects
                ADD CONSTRAINT projects_tenant_id_name_unique UNIQUE (tenant_id, name);
            
            
            --
            -- Name: projects projects_agency_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
            --
            
            ALTER TABLE ONLY public.projects
                ADD CONSTRAINT projects_agency_id_foreign FOREIGN KEY (agency_id) REFERENCES public.agencies(id);
            
            
            --
            -- Name: projects projects_created_in_period_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
            --
            
            ALTER TABLE ONLY public.projects
                ADD CONSTRAINT projects_created_in_period_foreign FOREIGN KEY (created_in_period) REFERENCES public.reporting_periods(id);
            
            
            --
            -- PostgreSQL database dump complete
            --
        `,
    );
};

exports.down = function (knex) {
    return knex.schema.dropTable('projects');
};
