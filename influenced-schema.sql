-- Exported from QuickDBD: https://www.quickdatabasediagrams.com/
-- Link to schema: https://app.quickdatabasediagrams.com/#/d/60vFsW
-- NOTE! If you have used non-SQL datatypes in your design, you will have to change these here.

CREATE TABLE influencers (
    id SERIAL PRIMARY KEY,
    cid TEXT NOT NULL UNIQUE,
    social_type TEXT NOT NULL,
    group_id TEXT,
    url TEXT NOT NULL,
    name TEXT,
    image TEXT,
    description TEXT,
    screen_name TEXT,
    users_count INTEGER,
    score FLOAT,
    credibility_score FLOAT
);

CREATE TABLE categories (
    category TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    parent TEXT
);

CREATE TABLE influencers_categories (
    category TEXT NOT NULL, 
    influencer_id INTEGER NOT NULL 
        REFERENCES influencers ON DELETE CASCADE,
    PRIMARY KEY (influencer_id, category)
);


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE
        CHECK (position('@' IN email) > 1),
    username VARCHAR(25) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_admin boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE ratings (
    user_id INTEGER
        REFERENCES users ON DELETE CASCADE,
    influencer_id INTEGER
        REFERENCES influencers ON DELETE CASCADE,
    score FLOAT NOT NULL,
    credibility_score FLOAT,
    review TEXT NOT NULL,
    PRIMARY KEY (user_id, influencer_id)
);


CREATE TABLE favorites (
    user_id INTEGER
        REFERENCES users ON DELETE CASCADE,
    influencer_id INTEGER
        REFERENCES influencers ON DELETE CASCADE,
    PRIMARY KEY (user_id, influencer_id)
);

