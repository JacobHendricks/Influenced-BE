"use strict";
require("dotenv").config();

/** Routes for influencers. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureLoggedIn } = require("../middleware/auth");
const Influencer = require("../models/influencer");

const influencerNewSchema = require("../schemas/companyNew.json");
const influencerUpdateSchema = require("../schemas/companyUpdate.json");
const influencerSearchSchema = require("../schemas/companySearch.json");
const { default: axios } = require("axios");

const router = new express.Router();
let influencerCache;

/** POST / { influencer } =>  { influencer }
 *
 * influencer should be { cid, socialType, groupId, url, name, image, description, screenName, usersCount }
 *
 * Returns { cid, socialType, groupId, url, name, image, description, screenName, usersCount }
 *
 * Authorization required: Logged In
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  let influencerTags;
  for (let data of influencerCache) {
    if (data.cid === req.body.cid) {
      influencerTags = data.tags;
      break;
    }
  }
  try {
    // const validator = jsonschema.validate(req.body, influencerNewSchema);
    // if (!validator.valid) {
    //   const errs = validator.errors.map(e => e.stack);
    //   throw new BadRequestError(errs);
    // }

    const influencer = await Influencer.create(req.body);
    console.log("INF TAGS", influencerTags)
    if (influencerTags) {
      const categories = await Influencer.addCategories(influencer.id, influencerTags);
      influencer.categories = categories;
    }
    return res.status(201).json({ influencer });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minUsersCount
 * - maxUsersCount
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const q = req.query;
  if (q.minUsersCount !== undefined) q.minUsersCount = +q.minUsersCount;
  if (q.maxUsersCount !== undefined) q.maxUsersCount = +q.maxUsersCount;

  try {
    // const validator = jsonschema.validate(q, companySearchSchema);
    // if (!validator.valid) {
    //   const errs = validator.errors.map(e => e.stack);
    //   throw new BadRequestError(errs);
    // }

    const influencers = await Influencer.findAll(q);
    return res.json({ influencers });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { influencer }
 *
 *  influencer is { cid, socialType, groupId, url, name, image, description, screenName, usersCount }
 *   where categories is [category, ...]
 *   where ratings is [{reviewerName, score, credibilityScore, review}, ...]
 *
 * Authorization required: none
 */

router.get("/id/:id", async function (req, res, next) {
  
  try {
    const influencer = await Influencer.get(req.params.id);
    return res.json({ influencer });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id] /ratings =>  { influencer }
 *
 *  influencer is { cid, socialType, groupId, url, name, image, description, screenName, usersCount }
 *   where categories is [category, ...]
 *   where ratings is [{reviewerName, score, credibilityScore, review}, ...]
 *
 * Authorization required: none
 */

router.get("/id/:id/ratings", async function (req, res, next) {

  try {
    const ratings = await Influencer.getRatings(req.params.id);
    // console.log("Influencer RATINGS*************************************", ratings)
    return res.json({ ratings });
  } catch (err) {
    return next(err);
  }
});

/** GET /[cid]  =>  { influencer id }
 *
 *  influencer is { cid, socialType, groupId, url, name, image, description, screenName, usersCount }
 * 
 * Authorization required: none
 */

router.get("/cid/:cid", async function (req, res, next) {
  try {
    const influencerId = await Influencer.getId(req.params.cid);
    return res.json({ influencerId });
  } catch (err) {
    return next(err);
  }
});

/** GET /search  =>  { influencer }
 *
 *  completes two queries. In both queries the search parameters are name(q), minUsersCount, and maxUsersCount:
 *    1) external API 'https://instagram-statistics-api.p.rapidapi.com/search'
 *    2) Get Influencer.findAll (SQL DB)
 * 
 *  The response array that is returned combines results of two queries, adding first the SQL DB results and then any non duplicate results from the external API
 *
 * Authorization required: none
 */

router.get("/search", async function (req, res, next) {
  const q = req.query;

  if (q.minUsersCount !== undefined) q.minUsersCount = +q.minUsersCount;
  if (q.maxUsersCount !== undefined) q.maxUsersCount = +q.maxUsersCount;

  try {
    const options = {
      method: 'GET',
      url: 'https://instagram-statistics-api.p.rapidapi.com/search',
      params: {
        page: '1',
        perPage: '10',
        sort: '-usersCount',
        q: q.q,
        tags: q.category,
        socialTypes: 'INST',
        minUsersCount: q.minUsersCount,
        maxUsersCount: q.maxUsersCount,
        trackTotal: 'true'
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPID_API_KEY,
        'X-RapidAPI-Host': 'instagram-statistics-api.p.rapidapi.com'
      }
    };
    const apiResponse = await axios.request(options);
    const sqlResponse = await Influencer.findAll(q);

    const influencers = [...sqlResponse]
    const cidSet = new Set(sqlResponse.map(r => r.cid));

    for (let res of apiResponse.data.data) {
      if (!cidSet.has(res.cid)) {
        influencers.push(res)
      }
    }

    influencerCache = influencers;
    // console.log(influencerCache);
    return res.json({ influencers });
  } catch (err) {
    return next(err);
  }
});



router.get("/category/:category", async function (req, res, next) {
  const q = req.query;
  q.category = req.params.category;

  if (q.minUsersCount !== undefined) q.minUsersCount = +q.minUsersCount;
  if (q.maxUsersCount !== undefined) q.maxUsersCount = +q.maxUsersCount;

  try {
    const options = {
      method: 'GET',
      url: 'https://instagram-statistics-api.p.rapidapi.com/search',
      params: {
        page: '1',
        perPage: '10',
        sort: '-usersCount',
        q: q.q,
        tags: q.category,
        socialTypes: 'INST',
        minUsersCount: q.minUsersCount,
        maxUsersCount: q.maxUsersCount,
        trackTotal: 'true'
      },
      headers: {
        'X-RapidAPI-Key': '43e65e0513msh92da16deb106f98p103517jsn9636b146c433',
        'X-RapidAPI-Host': 'instagram-statistics-api.p.rapidapi.com'
      }
    };
    const apiResponse = await axios.request(options);
    const sqlResponse = await Influencer.findAll(q);

    const influencers = [...sqlResponse]
    const cidSet = new Set(sqlResponse.map(r => r.cid));

    for (let res of apiResponse.data.data) {
      if (!cidSet.has(res.cid)) {
        influencers.push(res)
      }
    }

    return res.json({ influencers });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[id] { fld1, fld2, ... } => { influencer }
 *
 * Patches influencer data.
 *
 * fields can be: { cid, socialType, groupId, url, name, image, description, screenName, usersCount }
 *
 * Returns { id, cid, socialType, groupId, url, name, image, description, screenName, usersCount }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    // const validator = jsonschema.validate(req.body, influencerUpdateSchema);
    // if (!validator.valid) {
    //   const errs = validator.errors.map(e => e.stack);
    //   throw new BadRequestError(errs);
    // }

    const influencer = await Influencer.update(req.params.id, req.body);
    return res.json({ influencer });
  } catch (err) {
    return next(err);
  }
});

router.patch("/updateScores/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    // const validator = jsonschema.validate(req.body, influencerUpdateSchema);
    // if (!validator.valid) {
    //   const errs = validator.errors.map(e => e.stack);
    //   throw new BadRequestError(errs);
    // }

    const scores = await Influencer.updateScores(req.params.id);
    return res.json({ scores });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Influencer.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
