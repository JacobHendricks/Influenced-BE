"use strict";

const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


/** Related functions for companies. */

class Category {
  /** Create a category (from data), update db, return new category data.
   *
   * data should be { category }
   *
   * Returns { category }
   **/

  static async create(data) {
    const result = await db.query(
          `INSERT INTO categories (category)
           VALUES ($1)
           RETURNING category`,
        [
          data.category
        ]);
    let category = result.rows[0];

    return category;
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

  /** Update category name.
   *
   * Data can include: { category }
   *
   * Returns { category }
   *
   * Throws NotFoundError if not found.
   */

  static async update(category) {

    const result = await db.query(
                      `UPDATE categories 
                      SET category = $1
                      WHERE category = $2
                      RETURNING category`,
                      [category, category])
    const category = result.rows[0];

    if (!category) throw new NotFoundError(`No category: ${category}`);

    return category;
  }

  /** Delete given category from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(category) {
    const result = await db.query(
          `DELETE
           FROM categories
           WHERE category = $1
           RETURNING category`, [category]);
    const category = result.rows[0];

    if (!category) throw new NotFoundError(`No category: ${category}`);
  }
}

module.exports = Category;
