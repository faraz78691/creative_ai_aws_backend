import db from "../config/db.js";
/**=======================user model start =====================================*/
export const isUsersExistsOrNot = async (email) => {
    return db.query("SELECT * FROM tbl_users WHERE email = ?", [email]);
};

export const userRegistration = async (data) => {
    return db.query("INSERT INTO tbl_users SET ?", [data]);
};

export const getUserDetails = async (data) => {
    return db.query("SELECT * FROM tbl_users WHERE email = ?", [data]);
};

export const updateUserToken = async (token, email) => {
    const query = "UPDATE tbl_users SET genToken = ? WHERE email = ?";
    return db.query(query, [token, email]);
};

export const fetchUsersByToken = async (genToken) => {
    return db.query("SELECT * FROM tbl_users WHERE genToken = ?", [genToken]);
};

export const updateUserPassword = async (password, token) => {
    const query = "UPDATE tbl_users SET password = ?, genToken = '' WHERE genToken = ?";
    return db.query(query, [password, token]);
};

export const fetchUsersById = async (id) => {
    return db.query("SELECT * FROM tbl_users WHERE id = ?", [id]);
};

export const changePassword = async (password, id) => {
    const query = "UPDATE tbl_users SET password = ? WHERE id = ?";
    return db.query(query, [password, id]);
};

export const fetchProjectDeatils = async () => {
    return db.query("SELECT * FROM tbl_projectdeatils");
};

export const insertFreeDemo = async (data) => {
    return db.query("INSERT INTO tbl_usersfreedemo SET ?", [data]);
};

export const fetchUsersFreeDemo = async () => {
    return db.query("SELECT * FROM tbl_usersfreedemo");
};

export const fetchUsersFreeDemoByid = async (id) => {
    return db.query("SELECT * FROM tbl_usersfreedemo WHERE id = ?", [id]);
};

export const insertTellaboutUs = async (updatedFields, id) => {
    const keys = Object.keys(updatedFields);
    const values = Object.values(updatedFields);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    values.push(id);
    const query = `UPDATE tbl_usersfreedemo SET ${setClause} WHERE id = ?`;
    return db.query(query, values);
};

export const fetchProjectFeaturesDeatils = async (id) => {
    const query = `SELECT sf.subFeaturesName, f.featuresName, f.id AS featuredId,sf.customisationPrice,
                   p.estimated_time,sf.price AS subFeaturedPrice
                   FROM tbl_projectsfeatures pf
                   JOIN tbl_subfeatures sf ON sf.id = pf.subFeatureId
                   JOIN tbl_features f ON f.id = sf.featureId
                   JOIN tbl_projectdeatils p ON p.id = pf.projectId
                   WHERE projectId = ?`;
    return db.query(query, [id]);
};

export const fetchFeaturesAndSubFeatures = async () => {
    const query = `SELECT sf.price as subFeaturedPrice, sf.subFeaturesName, f.featuresName,sf.customisationPrice, f.id 
                   FROM tbl_features f
                   JOIN tbl_subfeatures sf ON sf.featureId = f.id`;
    return db.query(query);
};

export const countProductSubFeatures = async (id) => {
    return db.query("SELECT * FROM tbl_projectsfeatures WHERE projectId = ?", [id]);
};

export const addClientsQuries = async (updatedFields, id) => {
    const keys = Object.keys(updatedFields);
    const values = Object.values(updatedFields);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    values.push(id);
    const query = `UPDATE tbl_clientlnqueries SET ${setClause} WHERE id = ?`;
    return db.query(query, values);
};

export const insertClientInquries = async (data) => {
    return db.query("INSERT INTO tbl_clientlnqueries SET ?", [data]);
};
export const insertUserPayment = async (data) => {
    return db.query("INSERT INTO tbl_userpaymentdetails SET ?", [data]);
};

export const fetchClientsInquriesById = async (id) => {
    return db.query("SELECT * FROM tbl_clientlnqueries WHERE id = ?", [id]);
};

export const insertClientInstallmentPlan = async (values) => {
    return db.query(`INSERT INTO tbl_installmentplan (clientInqueryId, dueDate, projectStage, amount) 
    VALUES ${values}`);
};

export const fetchAllProjectsClientId = async (id) => {
    return db.query("SELECT * FROM tbl_clientlnqueries WHERE userId = ?", [id]);
};

/**========================model end========================= */
