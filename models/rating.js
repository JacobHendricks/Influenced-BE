"use strict";

const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


/** Related functions for companies. */

class Rating {
  /** Create a rating (from data), update db, return new rating data.
   *
   * data should be { userId, influencerId, score, credibility_score, review }
   *
   * Returns { userId, influencerId, score, credibility_score, review }
   **/

  static async create(data) {
    const result = await db.query(
          `INSERT INTO ratings (user_id,
                             influencer_id,
                             score,
                             credibility_score,
                             review)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING user_id AS "userId",
                      influencer_id AS "influencerId",
                      score,
                      credibility_score AS "credibilityScore",
                      review`,
        [
          data.userId,
          data.influencerId,
          data.score,
          data.credibilityScore,
          data.review
        ]);
    let rating = result.rows[0];

    return rating;
  }

  /** Given a userId and influencerId, return data about rating.
   *
   * Returns { influencerName, score, credibilityScore, review }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(userId, influencerId) {
    const ratingRes = await db.query(
          `SELECT i.name, r.score, r.credibility_score, r.review
            FROM influencers AS i
            JOIN ratings AS r
            ON i.id = r.influencer_id
            WHERE r.user_id = $1 AND r.influencer_id = $2`,
          [userId, influencerId]);

    const rating = ratingRes.rows[0];

    if (!rating) throw new NotFoundError(`No rating: ${userId, influencerId}`);

    return rating;
  }

  /** Update rating data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { score, credibilityScore, review }
   *
   * Returns { influencerName, score, credibilityScore, review }
   *
   * Throws NotFoundError if not found.
   */

  static async update(userId, influencerId, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          credibilityScore: "credibility_score",
        });
    const userIdVarIdx = "$" + (values.length + 1);
    const influencerIdVarIdx = "$" + (values.length + 2);

    const querySql = `UPDATE ratings 
                      SET ${setCols} 
                      WHERE user_id = ${userIdVarIdx} AND influencer_id = ${influencerIdVarIdx}
                      RETURNING user_id AS "userId",
                      influencer_id AS "influencerId",
                      score,
                      credibility_score AS "credibilityScore",
                      review`;
    const result = await db.query(querySql, [...values, userId, influencerId]);
    const rating = result.rows[0];

    if (!rating) throw new NotFoundError(`No rating: ${userId, influencerId}`);

    return rating;
  }

  /** Delete given rating from database; returns undefined.
   *
   * Throws NotFoundError if rating not found.
   **/

  static async remove(userId, influencerId) {
    console.log("Starting Rating.remove", userId, influencerId)
    const result = await db.query(
          `DELETE
           FROM ratings
           WHERE user_id = $1 AND influencer_id = $2
           RETURNING influencer_id`, [userId, influencerId]);
    const rating = result.rows[0];

    if (!rating) throw new NotFoundError(`No rating with userId: ${userId} and influencerId: ${influencerId}`);
  }
}

module.exports = Rating;

