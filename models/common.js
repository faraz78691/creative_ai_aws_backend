import db from "../config/db.js";

export const insertData = async (table, data) => {
  return db.query(`INSERT INTO ${table} SET ?`, [data]);
};

export const updateData = async (table, data, where) => {
  return db.query(`update ${table} SET ? ${where}`, [data]);
};

export const getDataPagination = async (table, where = '', options = {}) => {
  const { page, limit, searchKey, searchColumn = 'projectName' } = options;

  let paginationClause = '';
  let searchClause = '';
  const params = [];

  if (searchKey) {
    searchClause = where ? ` AND ${searchColumn} LIKE ?` : `WHERE ${searchColumn} LIKE ?`;
    params.push(`%${searchKey}%`);
  }
  const countQuery = `SELECT COUNT(*) as total FROM ${table} ${where} ${searchClause}`;
  let dataQuery = `SELECT * FROM ${table} ${where} ${searchClause}`;

  if (page && limit) {
    const offset = (page - 1) * limit;
    paginationClause = ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    dataQuery += paginationClause;
  }


  const rows = await db.query(dataQuery, params);  // returns just rows
  const count = await db.query(countQuery,params.slice(0, params.length - 2)); // also just rows

  return {
    data: rows,
    pagination: page && limit ? { total: count[0]?.total || 0, page, limit } : null
  };
};

export const getData = async (table, where) => {
  return db.query(`select * from ${table} ${where}`);
};



export const getDataWithJoin = async ({
  baseTable,
  joinTable,
  baseAlias = 'a',
  joinAlias = 'b',
  baseFields = '*',
  joinFields = [],
  onCondition,
  where = '',
}) => {
  const joinFieldsStr = joinFields.map(field => `${joinAlias}.${field}`).join(', ');
  const query = `
    SELECT ${baseAlias}.*, ${joinFieldsStr}
    FROM ${baseTable} ${baseAlias}
    LEFT JOIN ${joinTable} ${joinAlias} ON ${onCondition}
    ${where}
  `;
  return db.query(query);
};

export const getDistinctData = async (table, where) => {
  return db.query(`select ${table} ${where}`);
};

export const deleteData = async (table, where) => {
  return db.query(`Delete from ${table} ${where}`);
};

export const fetchCount = async (table, where) => {
  return db.query(`select count(*) as total from ${table} ${where}`);
};

export const getSelectedColumn = async (column, table, where) => {
  return db.query(`select ${column} from ${table} ${where}`);
};

export const filtertags = async (search) => {
  let where = ` WHERE tag_name LIKE '%${search}%'`;
  const query = `SELECT * FROM tags ${where} ORDER BY id DESC`;
  return db.query(query);
};