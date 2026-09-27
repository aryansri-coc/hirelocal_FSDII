import { db } from '../../../../database/db.js';

export async function getAllServices(req, res, next) {
  try {
    const services = db.find('service_categories', (s) => s.active !== false);
    return res.json({
      success: true,
      data: services
    });
  } catch (err) {
    next(err);
  }
}

export async function getServiceById(req, res, next) {
  try {
    const { id } = req.params;
    const service = db.findOne('service_categories', (s) => s.service_id === id || s.slug === id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: { message: `Service category '${id}' not found.` }
      });
    }

    return res.json({
      success: true,
      data: service
    });
  } catch (err) {
    next(err);
  }
}
