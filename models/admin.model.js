import db from "../config/db.js";

/**=======================user model start =====================================*/
export const isAdminExistsOrNot = async (email) => {
    return db.query("SELECT * FROM tbl_admin WHERE email = ?", [email]);
};

export const userRegistration = async (data) => {
    return db.query("INSERT INTO tbl_users SET ?", [data]);
};

export const updateAdminToken = async (token, email) => {
    const query = "UPDATE tbl_admin SET genToken = ? WHERE email = ?";
    return db.query(query, [token, email]);
};

export const fetchAdminByToken = async (genToken) => {
    return db.query("SELECT * FROM tbl_admin WHERE genToken = ?", [genToken]);
};

export const updateAdminPassword = async (password, token) => {
    const query = "UPDATE tbl_admin SET password = ?, genToken = '' WHERE genToken = ?";
    return db.query(query, [password, token]);
};

export const fetchAdminById = async (id) => {
    return db.query("SELECT * FROM tbl_admin WHERE id = ?", [id]);
};

export const changePassword = async (password, id) => {
    const query = "UPDATE tbl_admin SET password = ? WHERE id = ?";
    return db.query(query, [password, id]);
};

export const fetchAllUsers = async () => {
    return db.query("SELECT * FROM tbl_users ");
};

export const fetchUsersAllBillingInfo = async () => {
    return db.query("SELECT * FROM tbl_users_billinginfo ");
};
export const getProjectsFeatures = async () => {
    return db.query("SELECT * FROM tbl_users_billinginfo ");
};
// services/projectService.js or similar
export const getProjectsFeaturesById = async (projectId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    // Get the project
    const projects = await db.query(
        `SELECT id AS projectId, projectName FROM builder_projects WHERE id = ?`,
        [projectId]
    );
    console.log(projects);
    const project = projects[0];
    if (!project) return [];

    // Get total feature count for pagination
    const total = await db.query(`
        SELECT COUNT(DISTINCT f.id) AS total
        FROM builder_features f
        JOIN builder_subfeatures sf ON sf.featureId = f.id
        JOIN project_subfeatures_mapping psm ON psm.subFeatureId = sf.id
        WHERE psm.projectId = ?
    `, [projectId]);
    console.log(total);
    // Get paginated features
    const features = await db.query(`
        SELECT DISTINCT f.id AS featureId, f.featuresName AS featureName
        FROM builder_features f
        JOIN builder_subfeatures sf ON sf.featureId = f.id
        JOIN project_subfeatures_mapping psm ON psm.subFeatureId = sf.id
        WHERE psm.projectId = ?
        LIMIT ? OFFSET ?
    `, [projectId, limit, offset]);
    console.log("features", features);

    // Attach subfeatures to each feature (all, no pagination)
    for (const feature of features) {
        const subFeatures = await db.query(`
            SELECT sf.id AS subFeatureId, sf.subFeaturesName AS subFeatureName, psm.status
            FROM builder_subfeatures sf
            JOIN project_subfeatures_mapping psm ON psm.subFeatureId = sf.id
            WHERE sf.featureId = ? AND psm.projectId = ?
        `, [feature.featureId, projectId]);

        feature.subFeatures = subFeatures;
    }

    // Attach features and pagination to project
    project.features = features;
    project.pagination = {
        page,
        limit,
        total
    };

    return [project];
};


export const addProjectSubfeatures = async (values) => {
    return db.query(`INSERT INTO project_subfeatures_mapping (projectId,featureId, subFeatureId) VALUES ?`, [values]);
};
export const getSubFeatureByFId = async (featureIds) => {
    return db.query(`SELECT * FROM builder_subfeatures WHERE featureId IN (?)`, [featureIds]);
};
export const getFeatureNameBySubFeature = async (subFeatureName, featureId = null) => {
    if(featureId){
        return db.query(`SELECT bs.id, bs.subFeaturesName, bs.featureId, bf.featuresName
            FROM builder_subfeatures bs
            JOIN builder_features bf ON bs.featureId = bf.id
            WHERE bs.subFeaturesName = ? AND bs.featureId != ?`, [subFeatureName, featureId]);
    } else{
        return db.query(`SELECT bs.id, bs.subFeaturesName, bs.featureId, bf.featuresName
            FROM builder_subfeatures bs
            JOIN builder_features bf ON bs.featureId = bf.id
            WHERE bs.subFeaturesName = ?`, [subFeatureName]);
    }
    
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
    const query = `SELECT sf.subFeaturesName, f.featuresName, f.id AS featuredId,
                   p.estimated_time,sf.price AS subFeaturedPrice
                   FROM tbl_projectsfeatures pf
                   JOIN tbl_subfeatures sf ON sf.id = pf.subFeatureId
                   JOIN tbl_features f ON f.id = sf.featureId
                   JOIN tbl_projectdeatils p ON p.id = pf.projectId
                   WHERE projectId = ?`;
    return db.query(query, [id]);
};

export const fetchFeaturesAndSubFeatures = async () => {
    const query = `SELECT sf.price as subFeaturedPrice, sf.subFeaturesName, f.featuresName, f.id 
                   FROM tbl_features f
                   JOIN tbl_subfeatures sf ON sf.featureId = f.id`;
    return db.query(query);
};

export const addBillingInfomation = async (data) => {
    return db.query("INSERT INTO tbl_users_billinginfo SET ?", [data]);
};


/**========================model end========================= */
