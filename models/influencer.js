"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Influencer {
  /** Create a influencer (from data), update db, return new influencer data.
   *
   * data should be { cid,
                       social_type,
                       group_id,
                       url,
                       name,
                       image,
                       description,
                       screen_name,
                       users_count,
                       rating }
   *
   * Returns { cid,
                       social_type,
                       group_id,
                       url,
                       name,
                       image,
                       description,
                       screen_name,
                       users_count }
   *
   * Throws BadRequestError if influencer already in database.
   * */

  static async create({ cid,
                        socialType,
                        groupId,
                        url,
                        name,
                        image,
                        description,
                        screenName,
                        usersCount }) {
    const duplicateCheck = await db.query(
          `SELECT cid
           FROM influencers
           WHERE cid = $1`,
        [cid]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate influencer: ${cid}`);

    const result = await db.query(
          `INSERT INTO influencers
                  (cid,
                    social_type,
                    group_id,
                    url,
                    name,
                    image,
                    description,
                    screen_name,
                    users_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, 
                      cid,
                      social_type AS "socialType",
                      group_id AS "groupId",
                      url,
                      name,
                      image,
                      description,
                      screen_name AS "screenName", 
                      users_count AS "usersCount"`,
        [
          cid,
          socialType,
          groupId,
          url,
          name,
          image,
          description,
          screenName,
          usersCount
        ],
    );
    const influencer = result.rows[0];

    return influencer;
  }

  /** Find all influencers (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - minUsersCount
   * - maxUsersCount
   * - q (name: will find case-insensitive, partial matches)
   *
   * Returns [{ cid,
                social_type,
                group_id,
                url,
                name,
                image,
                description,
                screen_name,
                users_count }, ...]
   * */

  // static async findAll(minUsersCount, maxUsersCount, q) {
  static async findAll(searchFilters = {}) {
    let query = `SELECT i.id,
                        i.cid,
                        i.social_type AS "socialType",
                        i.group_id AS "groupId",
                        i.url,
                        i.name,
                        i.image,
                        i.description,
                        i.screen_name AS "screenName", 
                        i.users_count AS "usersCount",
                        i.score,
                        i.credibility_score AS "credibilityScore"
                      FROM influencers AS i
                      LEFT JOIN influencers_categories AS ic
                      ON i.id = ic.influencer_id
                      LEFT JOIN categories AS c
                      ON ic.category = c.category`;
    let whereExpressions = [];
    let queryValues = [];

    const { minUsersCount, maxUsersCount, q, category } = searchFilters;

    if (minUsersCount > maxUsersCount) {
      throw new BadRequestError("Min usersCount cannot be greater than max");
    }

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (minUsersCount !== undefined) {
      queryValues.push(minUsersCount);
      whereExpressions.push(`i.users_count >= $${queryValues.length}`);
    }

    if (maxUsersCount !== undefined) {
      queryValues.push(maxUsersCount);
      whereExpressions.push(`i.users_count <= $${queryValues.length}`);
    }

    if (q) {
      queryValues.push(`%${q}%`);
      whereExpressions.push(`(i.name ILIKE $${queryValues.length} OR i.screen_name ILIKE $${queryValues.length})`);
    }

    if (category !== undefined) {
      queryValues.push(category);
      whereExpressions.push(`c.category = $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    // Finalize query and return results

    query += " GROUP BY i.id ORDER BY i.score DESC NULLS LAST LIMIT 10";
    const influencersRes = await db.query(query, queryValues);
    return influencersRes.rows;
  }


  // static async findAll(searchFilters = {}) {
  //   let query = `SELECT id,
  //                       cid,
  //                       social_type AS "socialType",
  //                       group_id AS "groupId",
  //                       url,
  //                       name,
  //                       image,
  //                       description,
  //                       screen_name AS "screenName", 
  //                       users_count AS "usersCount",
  //                       score,
  //                       credibility_score
  //                     FROM influencers`;
  //   let whereExpressions = [];
  //   let queryValues = [];

  //   const { minUsersCount, maxUsersCount, q } = searchFilters;

  //   if (minUsersCount > maxUsersCount) {
  //     throw new BadRequestError("Min usersCount cannot be greater than max");
  //   }

  //   // For each possible search term, add to whereExpressions and queryValues so
  //   // we can generate the right SQL

  //   if (minUsersCount !== undefined) {
  //     queryValues.push(minUsersCount);
  //     whereExpressions.push(`users_count >= $${queryValues.length}`);
  //   }

  //   if (maxUsersCount !== undefined) {
  //     queryValues.push(maxUsersCount);
  //     whereExpressions.push(`users_count <= $${queryValues.length}`);
  //   }

  //   if (q) {
  //     queryValues.push(`%${q}%`);
  //     whereExpressions.push(`(name ILIKE $${queryValues.length} OR screen_name ILIKE $${queryValues.length})`);
  //   }

  //   if (whereExpressions.length > 0) {
  //     query += " WHERE " + whereExpressions.join(" AND ");
  //   }

  //   // Finalize query and return results

  //   query += " ORDER BY name";
  //   const influencersRes = await db.query(query, queryValues);
  //   return influencersRes.rows;
  // }

  /** Given an influencer id, return data about influencer.
   *
   * Returns { id, cid, social_type, group_id, url, name, image, description, screen_name, users_count }
   *   where categories is [category, ...]
   *   where ratings is [{reviewerName, score, credibilityScore, review}, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const influencerRes = await db.query(
          `SELECT id,
                  cid,
                  social_type AS "socialType",
                  group_id AS "groupId",
                  url,
                  name,
                  image,
                  description,
                  screen_name AS "screenName", 
                  users_count AS "usersCount"
          FROM influencers
          WHERE id = $1`,
        [id]);

    const influencer = influencerRes.rows[0];

    if (!influencer) throw new NotFoundError(`No influencer with id: ${id}`);

    const categoriesRes = await db.query(
          `SELECT category
           FROM influencers_categories
           WHERE influencer_id = $1;`,
        [id],
    );

    influencer.categories = categoriesRes.rows.map(r => r.category);

    const ratingsRes = await db.query(
      `SELECT u.username AS "reviewerName", r.score, r.credibility_score AS "credibilityScore", r.review
       FROM users AS u
       JOIN ratings AS r
       ON u.id = r.user_id
       WHERE r.influencer_id = $1`, [id]);

    influencer.ratings = ratingsRes.rows;

    return influencer;
  }

  /** Given an influencer cid, return influencer id.
   *
   * Returns { id }
   *
   * Throws NotFoundError if not found.
   **/  

  static async getId(cid) {
    const influencerRes = await db.query(
          `SELECT id
          FROM influencers
          WHERE cid = $1`,
        [cid]);

    const influencerId = influencerRes.rows[0];

    if (!influencerId) throw new NotFoundError(`No influencer with id: ${id}`);

    return influencerId;
  }

  /** Given an influencer id, return data about influencer.
   *
   * Returns { id, cid, social_type, group_id, url, name, image, description, screen_name, users_count }
   *   where categories is [category, ...]
   *   where ratings is [{reviewerName, score, credibilityScore, review}, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async getRatings(id) {
    const influencerCheck = await db.query(
          `SELECT id
          FROM influencers
          WHERE id = $1`,
        [id]);

    const influencer = influencerCheck.rows[0];

    if (!influencer) throw new NotFoundError(`No influencer with id: ${id}`);

    const categoriesRes = await db.query(
          `SELECT category
           FROM influencers_categories
           WHERE influencer_id = $1;`,
        [id],
    );

    influencer.categories = categoriesRes.rows.map(r => r.category);

    const ratingsRes = await db.query(
      `SELECT u.username AS "reviewerName", r.score, r.credibility_score AS "credibilityScore", r.review
       FROM users AS u
       JOIN ratings AS r
       ON u.id = r.user_id
       WHERE r.influencer_id = $1`, [id]);

    influencer.ratings = ratingsRes.rows;

    return influencer;
  }


  /** Given an influencer id, get the average score and update influencer score.
   *
   * Returns { scores, credibilityScores }
   *
   * Throws NotFoundError if not found.
   **/

  static async updateScores(id) {
    const updateScoreRes = await db.query(
      `Update influencers
       SET score = AvgScore, credibility_score = AvgCred 
       FROM
          (SELECT AVG(r.score) AvgScore, AVG(r.credibility_score) AvgCred
            FROM ratings AS r
            LEFT JOIN influencers 
            ON r.influencer_id = influencers.id
            WHERE influencers.id = $1) AS A
       WHERE influencers.id = $2
       Returning AvgScore AS "score", AvgCred AS "credibilityScore"`, [id, id]);

      // `Update influencers
      //  SET score = AvgScore FROM
      //     (SELECT AVG(r.score) AvgScore 
      //       FROM ratings AS r
      //       LEFT JOIN influencers 
      //       ON r.influencer_id = influencers.id
      //       WHERE influencers.id = $1) AS A
      //  WHERE influencers.id = $2
      //  Returning AvgScore`, [id, id]);

    const scores = updateScoreRes.rows[0];

    return scores;
  }

  /** Update influencer data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {cid, socialType, groupId, url, name, image, description, screenName, usersCount}
   *
   * Returns { id, cid, socialType, groupId, url, name, image, description, screenName, usersCount }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          socialType: "social_type",
          groupId: "group_id",
          screenName: "screen_name", 
          usersCount: "users_count"
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE influencers 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id,
                                cid,
                                social_type AS "socialType",
                                group_id AS "groupId",
                                url,
                                name,
                                image,
                                description,
                                screen_name AS "screenName", 
                                users_count AS "usersCount"`;
    const result = await db.query(querySql, [...values, id]);
    const influencer = result.rows[0];

    if (!influencer) throw new NotFoundError(`No influencer id: ${id}`);

    return influencer;
  }


  static async addCategories(id, tags) {
    let tagsArr = tags.map(t => `('${t}', ${id})`)
    let setValues = tagsArr.join(", ")
    console.log("ADD CATEGORIES SET VALUES", setValues)

    const result = await db.query(
      `INSERT INTO influencers_categories
        (category, influencer_id)
      VALUES ${setValues}
      RETURNING category, influencer_id;`);
    const categories = result.rows[0];

    return categories;
  }

  /** Delete given influencer from database; returns undefined.
   *
   * Throws NotFoundError if influencer not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM influencers
           WHERE id = $1
           RETURNING id`,
        [id]);
    const influencer = result.rows[0];

    if (!influencer) throw new NotFoundError(`No influencer: ${id}`);
  }
}


module.exports = Influencer;
