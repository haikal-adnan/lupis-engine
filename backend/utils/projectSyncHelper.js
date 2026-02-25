import Project from "../models/nosql/Project.js";
import Scene from "../models/nosql/Scene.js";
import Prefab from "../models/nosql/Prefab.js";
import Script from "../models/nosql/Script.js";

export const syncProjectData = async (projectId, payload) => {
  const { project, scenes = [], prefabs = [], scripts = [] } = payload;

  if (project) {
    const { _id, ...projectData } = project; 
    await Project.findByIdAndUpdate(projectId, { $set: projectData }, { new: true, upsert: true });
  }

  const syncCollection = async (Model, incomingData) => {
    if (!incomingData) return;

    const incomingIds = incomingData.map(item => item._id);
    const bulkOps = [];

    incomingData.forEach(item => {
      bulkOps.push({
        updateOne: {
          filter: { _id: item._id, projectId: projectId },
          update: { $set: item },
          upsert: true
        }
      });
    });

    bulkOps.push({
      deleteMany: {
        filter: { 
          projectId: projectId, 
          _id: { $nin: incomingIds } 
        }
      }
    });

    if (bulkOps.length > 0) {
      await Model.bulkWrite(bulkOps);
    }
  };

  await Promise.all([
    syncCollection(Scene, scenes),
    syncCollection(Prefab, prefabs),
    syncCollection(Script, scripts)
  ]);

  return true;
};