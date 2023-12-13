"use strict";

/** Routes for ratings. */

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureLoggedIn, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const Rating = require("../models/rating");
const ratingNewSchema = require("../schemas/ratingNew.json");
const ratingUpdateSchema = require("../schemas/ratingUpdate.json");

const router = express.Router({ mergeParams: true });


/** POST / { rating } => { rating }
 *
 * rating should be { user_id,
                             influencer_id,
                             score,
                             credibility_score,
                             review }
 *
 * Returns { user_id AS "userId",
                      influencer_id AS "influencerId",
                      score,
                      credibility_score AS "credibilityScore",
                      review }
 *
 * Authorization required: logged in
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  const data = req.body;
  // arrive as strings from body, but we want as int
  data.userId = +data.userId;
  data.influencerId = +data.influencerId;
  data.score = +data.score;
  if (data.credibilityScore !== undefined) data.credibilityScore = +data.credibilityScore;

  try {
    const validator = jsonschema.validate(data, ratingNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const rating = await Rating.create(data);
    return res.status(201).json({ rating });
  } catch (err) {
    return next(err);
  }
});



/** PATCH / user / [userID] / influencer / [influencerId]  { fld1, fld2, ... } => { rating }
 *
 * Data can include: { score, credibilityScore, review }
 *
 * Returns { userId, influencerId, score, credibilityScore, review }
 *
 * Authorization required: Correct User or Admin
 */

router.patch("/user/:userId/influencer/:influencerId", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    // const validator = jsonschema.validate(req.body, jobUpdateSchema);
    // if (!validator.valid) {
    //   const errs = validator.errors.map(e => e.stack);
    //   throw new BadRequestError(errs);
    // }

    const rating = await Rating.update(req.params.userId, req.params.influencerId, req.body);
    return res.json({ rating });
  } catch (err) {
    return next(err);
  }
});

/** DELETE / user / [userID] / influencer / [influencerId] =>  { deleted: influencerId }
 *
 * Authorization required: Correct User or Admin
 */


router.delete("/user/:userId/influencer/:influencerId", ensureLoggedIn, async function (req, res, next) {
  try {
    const infId = +req.params.influencerId
    await Rating.remove(req.params.userId, req.params.influencerId);
    return res.json({ deleted: infId });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
