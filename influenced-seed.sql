-- both test users have the password 'password'

INSERT INTO users (email, username, password, is_admin)
VALUES ('testuser@testuser.com',
        'TestUser',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        FALSE),
       ('testadmin@testadmin.com',
        'TestAdmin',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        TRUE);

INSERT INTO influencers (cid,
                       social_type,
                       group_id,
                       url,
                       name,
                       image,
                       description,
                       screen_name,
                       users_count)
VALUES ('INST:17841401533632915', 'INST', '17841401533632915', 'https://instagram.com/cbum', 'Chris Bumstead', 'https://36627.selcdn.ru/jagajam-c90/INST:17841401533632915?time=1695443034', 'Classic Physique Mr. Olympia x4🇨🇦 @getrawnutrition @bumenergy @vaughnstreats @Revive_MD @YoungLA CBUM FITNESS MERCH DROP IS LIVE👇🏼','cbum', 18688930),
        ('INST:17841400005463628', 'INST', '17841400005463628', 'https://instagram.com/therock', 'Dwayne Johnson', 'https://36627.selcdn.ru/jagajam-c90/INST:17841400005463628?time=1685686046', 'founder', 'therock', 382160432);

INSERT INTO categories (category, name)
VALUES ('celebrity', 'Celebrity'), 
        ('actor', 'Actor'), 
        ('business', 'Business'), 
        ('influencer', 'Influencer'), 
        ('government', 'Government'), 
        ('other', 'Other'),
        ('personal', 'Personal'),
        ('public', 'Public'),
        ('accessories-and-jewellery', 'Accessories & Jewelry'),
        ('adult-content', 'Adult content'),
        ('alcohol-alcohol', 'Alcohol'),
        ('animals', 'Animals'),
        ('architecture-and-urban-design', 'Architecture & Urban Design'),
        ('art-artists', 'Art'),
        ('beauty', 'Beauty'),
        ('business-and-careers', 'Business & Careers'),
        ('cars-and-motorbikes', 'Cars & Motorcycles'),
        ('cinema-and-Actors-actresses', 'Cinema & Actors/actresses'),
        ('clothing-and-outfits', 'Clothing & Outfits'),
        ('comics-and-sketches', 'Comics & sketches'),
        ('computers-and-gadgets','Computers & Gadgets'),
        ('crypto', 'Crypto'),
        ('diy-and-design', 'DIY & Design'),
        ('education-education', 'Education'),
        ('extreme-sports-and-outdoor-activity', 'Extreme Sports & Outdoor activity'),
        ('family', 'Family'),
        ('fashion-fashion', 'Fashion'),
        ('finance-and-economics', 'Finance & Economics'),
        ('fitness-and-gym', 'Fitness & Gym'),
        ('food-and-cooking', 'Food & Cooking'),
        ('gaming','Gaming'),
        ('health-and-medicine', 'Health & Medicine'),
        ('humor-and-fun-and-happiness', 'Humor & Fun'),
        ('kids-and-toys','Kids & Toys'),
        ('lifestyle', 'Lifestyle'),
        ('literature-and-journalism','Literature & Journalism'),
        ('luxury','Luxury'),
        ('machinery-and-technologies','Machinery & Technologies'),
        ('management-and-marketing','Management & Marketing'),
        ('mobile-related','Mobile related'),
        ('modeling','Modeling'),
        ('music-music','Music'),
        ('nft','NFT'),
        ('nature-and-landscapes','Nature & landscapes'),
        ('photography','Photography'),
        ('politics-politics', 'Politics'),
        ('racing-sports','Racing'),
        ('science', 'Science'),
        ('shopping-and-retail','Shopping & Retail'),
        ('shows', 'Shows'),
        ('sports','Sports'),
        ('sports-with-a-ball','Sports'),
        ('sweets-and-bakery','Baking & Sweets'),
        ('tobacco-and-smoking','Tobacco & Smoking'),
        ('trainers-and-coaches','Trainers & Coaches'),
        ('travel-travel','Travel'),
        ('water-sports','Water sports'),
        ('winter-sports','Winter sports');

INSERT INTO ratings (user_id,
                        influencer_id,
                        score,
                        credibility_score,
                        review)
VALUES (1, 1, 4, 4, 'Gives great insight into his workouts and methods. CBUM products are fantastic to use.'), 
(1, 2, 3, 4, 'Im not always interested in his posts.  Sometimes he rants for too long.  Seems very full of himself (rightfully so).');

INSERT INTO favorites (user_id, influencer_id)
VALUES (1, 1), (1, 2);

INSERT INTO influencers_categories (category, influencer_id)
VALUES ('fitness-and-gym', 1), ('celebrity', 2), ('fitness-and-gym', 2), ('actor', 2);

