const db = require("../db/connection");

exports.selectAllArticles = (sort_by, order, topic) => {
  if (!sort_by || sort_by === "date") sort_by = "created_at";

  if (order && !["asc", "desc"].includes(order)) {
    return Promise.reject({
      status: 400,
      msg: "Please enter a valid order query",
    });
  }

  if (!order) order = "desc";
  const validColumns = [
    "title",
    "author",
    "article_id",
    "votes",
    "created_at",
    "comment_count",
    "topic",
  ];
  if (sort_by && !validColumns.includes(sort_by)) {
    return Promise.reject({
      status: 400,
      msg: "Please enter a valid sort_by query",
    });
  }

  let propData = [];

  let queryStr = `SELECT articles.*,
  COUNT(comment_id) :: int AS comment_count
  FROM articles
  LEFT JOIN comments ON comments.article_id = articles.article_id`;

  if (topic) {
    queryStr += ` WHERE articles.topic = $1`;
    propData.push(topic);
  }

  if (sort_by) {
    queryStr += ` GROUP BY articles.article_id ORDER BY ${sort_by} ${order};`;
  } else {
    queryStr += ` GROUP BY articles.article_id ORDER BY created_at ASC;`;
  }

  return db.query(queryStr, propData).then((data) => {
    return data.rows;
  });
};

exports.selectArticleId = (article_id) => {
  return db
    .query(
      `SELECT articles.*, COUNT(comments.article_id) :: INT AS comment_count
      FROM articles LEFT JOIN comments ON articles.article_id = comments.article_id
      WHERE articles.article_id = $1
      GROUP BY articles.article_id;`,
      [article_id]
    )
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ msg: "article not found", status: 404 });
      } else {
        return result.rows[0];
      }
    });
};

exports.updateArticleById = (article_id, inc_votes) => {
  return db
    .query(`SELECT votes FROM articles WHERE article_id = $1`, [article_id])
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ msg: "article not found", status: 404 });
      } else if (!inc_votes) {
        return Promise.reject({ msg: "body missing / wrong key", status: 400 });
      } else if (typeof inc_votes !== "number") {
        return Promise.reject({ msg: "votes should be a number", status: 400 });
      } else {
        const newVotes = result.rows[0].votes + inc_votes;
        return db
          .query(
            `UPDATE articles SET votes = $1 WHERE article_id = $2 RETURNING *;`,
            [newVotes, article_id]
          )
          .then((result) => {
            return result.rows[0];
          });
      }
    });
};

exports.updateCommentByArticle = (article_id, username, body) => {
  return db
    .query(
      `INSERT INTO comments (body, author, article_id)
    VALUES ($1, $2, $3, 0)
    RETURNING *;`,
      [body, username, article_id]
    )
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err);
    });
};
