import { db } from '../../../../database/db.js';
import { matchWorkers, getAlternativeWorkers } from '../../../../packages/services/matchingEngine.js';
import { validateWorkerProfile, isValidIndianPhone, normalizePhone } from '../../../../packages/validation/validators.js';
import { calculateWorkerReliability } from '../../../../packages/services/reliabilityCalculator.js';
import { getCoordinatesForPincode } from '../routes/pincodeRoutes.js';

export async function getAllWorkers(req, res, next) {
  try {
    const { profession, status, communication_type, search } = req.query;
    let workers = db.getCollection('workers');

    // Filter out suspended workers unless admin
    workers = workers.filter((w) => w.account_status !== 'suspended' && w.verification_status !== 'rejected');

    if (profession) {
      workers = workers.filter((w) =>
        w.profession.toLowerCase().includes(profession.toLowerCase())
      );
    }
    if (status) {
      workers = workers.filter((w) => w.status === status);
    }
    if (communication_type) {
      workers = workers.filter((w) => w.communication_type === communication_type);
    }
    if (search) {
      const term = search.toLowerCase();
      workers = workers.filter((w) =>
        w.name.toLowerCase().includes(term) ||
        w.profession.toLowerCase().includes(term) ||
        (w.skills && w.skills.some((s) => s.toLowerCase().includes(term))) ||
        (w.location?.name && w.location.name.toLowerCase().includes(term)) ||
        (w.pincode && String(w.pincode).includes(term)) ||
        (w.location?.pincode && String(w.location.pincode).includes(term))
      );
    }

    // Attach enriched reliability info
    const enriched = workers.map((w) => {
      const reliabilityInfo = calculateWorkerReliability(w.completed_jobs, w.total_accepted_jobs);
      return {
        ...w,
        reliability_info: reliabilityInfo
      };
    });

    return res.json({
      success: true,
      data: enriched
    });
  } catch (err) {
    next(err);
  }
}

export async function getWorkerById(req, res, next) {
  try {
    const { id } = req.params;
    const worker = db.findById('workers', 'worker_id', id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: { message: `Worker with ID '${id}' not found.` }
      });
    }

    const ratings = db.find('ratings', (r) => String(r.worker_id) === String(worker.worker_id));
    const reliabilityInfo = calculateWorkerReliability(worker.completed_jobs, worker.total_accepted_jobs);

    return res.json({
      success: true,
      data: {
        ...worker,
        reliability_info: reliabilityInfo,
        ratings,
        reviews_count: ratings.length
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function matchEligibleWorkers(req, res, next) {
  try {
    const { service, date, lat, lng, skill, maxDistanceKm } = req.query;

    const allWorkers = db.find('workers', (w) => w.account_status !== 'suspended' && w.verification_status !== 'rejected');
    const matched = matchWorkers(allWorkers, {
      service,
      date,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      skill,
      maxDistanceKm: maxDistanceKm ? parseFloat(maxDistanceKm) : 30
    });

    const enriched = matched.map((w) => ({
      ...w,
      reliability_info: calculateWorkerReliability(w.completed_jobs, w.total_accepted_jobs)
    }));

    return res.json({
      success: true,
      criteria: { service, date, lat, lng, skill },
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    next(err);
  }
}

export async function getWorkerAlternatives(req, res, next) {
  try {
    const { current_worker_id, service, date, lat, lng } = req.query;

    if (!current_worker_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'current_worker_id query parameter is required.' }
      });
    }

    const allWorkers = db.find('workers', (w) => w.account_status !== 'suspended');
    const alternatives = getAlternativeWorkers(allWorkers, current_worker_id, {
      service,
      date,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null
    });

    const enriched = alternatives.map((w) => ({
      ...w,
      reliability_info: calculateWorkerReliability(w.completed_jobs, w.total_accepted_jobs)
    }));

    return res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Real Worker Onboarding / Registration (Section 6 & 7)
 * Implements 7-step onboarding process into database
 */
export async function registerAsWorker(req, res, next) {
  try {
    let user = req.user;
    const {
      name,
      phone,
      profession,
      skills,
      experience = 1,
      bio,
      city = 'Bhopal',
      location_name,
      service_radius = 15,
      working_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      communication_type = 'smartphone',
      languages = ['hi'],
      daily_rate = 500,
      pincode
    } = req.body;

    if (!profession || profession.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'Primary profession/trade is required.' }
      });
    }

    // Auto-create or link user if unauthenticated
    if (!user) {
      if (!phone || !isValidIndianPhone(phone)) {
        return res.status(400).json({
          success: false,
          error: { message: 'A valid 10-digit mobile number is required to register as a worker.' }
        });
      }

      const cleanPhone = normalizePhone(phone);
      user = db.findOne('users', (u) => normalizePhone(u.phone) === cleanPhone);

      if (!user) {
        const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        user = {
          user_id: userId,
          name: name?.trim() || 'Skilled Pro',
          phone: cleanPhone,
          email: null,
          address: location_name || `${city}, MP`,
          role: 'worker',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.insert('users', user);
      } else {
        db.update('users', (u) => u.user_id === user.user_id, {
          role: 'worker',
          name: name?.trim() || user.name
        });
        user = db.findById('users', 'user_id', user.user_id);
      }
    }

    // Check if worker already exists for this user
    let worker = db.findById('workers', 'user_id', user.user_id);

    const parsedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [profession];

    const targetPin = (pincode || '462011').toString().trim();
    let coords = { lat: 23.2332, lng: 77.4343 };
    try {
      const resolved = await getCoordinatesForPincode(targetPin);
      if (resolved && resolved.lat && resolved.lng) {
        coords = { lat: resolved.lat, lng: resolved.lng };
      }
    } catch (e) {}

    const locName = location_name || (address ? `${address}, ${city}` : `${city}, MP`);

    if (worker) {
      // Update existing worker profile
      const updates = {
        profession: profession.trim(),
        skills: parsedSkills,
        experience: Number(experience) || 1,
        bio: bio?.trim() || worker.bio,
        pincode: targetPin,
        location_name: locName,
        location: {
          name: locName,
          pincode: targetPin,
          lat: coords.lat,
          lng: coords.lng
        },
        service_radius: Number(service_radius) || 15,
        working_days: Array.isArray(working_days) ? working_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        communication_type: communication_type === 'non_smartphone' ? 'non_smartphone' : 'smartphone',
        languages: Array.isArray(languages) ? languages : ['hi'],
        daily_rate: Number(daily_rate) || 500,
        status: 'available',
        updated_at: new Date().toISOString()
      };

      db.update('workers', (w) => w.worker_id === worker.worker_id, updates);
      worker = db.findById('workers', 'worker_id', worker.worker_id);

      // Sync user address and pincode
      db.update('users', (u) => u.user_id === user.user_id, {
        address: locName,
        pincode: targetPin,
        updated_at: new Date().toISOString()
      });

      db.addAuditLog({
        actorId: user.user_id,
        actorName: user.name,
        action: 'WORKER_PROFILE_UPDATED',
        entityType: 'worker',
        entityId: worker.worker_id,
        source: 'web',
        metadata: { profession, pincode: targetPin, service_radius }
      });
    } else {
      // Create brand new worker profile
      const workerId = `wrk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      worker = {
        worker_id: workerId,
        user_id: user.user_id,
        name: name?.trim() || user.name,
        phone: phone || user.phone,
        profession: profession.trim(),
        services: [profession.trim()],
        skills: parsedSkills,
        experience: Number(experience) || 1,
        language: languages[0] || 'hi',
        languages: Array.isArray(languages) ? languages : ['hi'],
        pincode: targetPin,
        location_name: locName,
        location: {
          name: locName,
          pincode: targetPin,
          lat: coords.lat,
          lng: coords.lng
        },
        service_radius: Number(service_radius) || 15,
        working_days: Array.isArray(working_days) ? working_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        communication_type: communication_type === 'non_smartphone' ? 'non_smartphone' : 'smartphone',
        rating: 5.0,
        reliability: null, // neutral "New on HireLocal" state
        completed_jobs: 0,
        total_accepted_jobs: 0,
        daily_rate: Number(daily_rate) || 500,
        status: 'available',
        verification_status: 'verified', // automatically verified for instant testing
        account_status: 'active',
        bio: bio?.trim() || `Skilled ${profession} offering quality local service.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Sync user address and pincode
      db.update('users', (u) => u.user_id === user.user_id, {
        address: locName,
        pincode: targetPin,
        updated_at: new Date().toISOString()
      });

      db.insert('workers', worker);

      // Update user role to worker (retaining capability)
      db.update('users', (u) => u.user_id === user.user_id, {
        role: 'worker'
      });

      // Audit log
      db.addAuditLog({
        actorId: user.user_id,
        actorName: user.name,
        action: 'WORKER_REGISTERED',
        entityType: 'worker',
        entityId: worker.worker_id,
        source: 'web',
        metadata: {
          profession: worker.profession,
          communication_type: worker.communication_type,
          daily_rate: worker.daily_rate
        }
      });

      // Notification
      db.addNotification({
        userId: user.user_id,
        title: 'Worker Profile Created! 🎉',
        message: `Congratulations! Your ${worker.profession} profile is active. You will now receive local service requests.`,
        type: 'worker_registered'
      });
    }

    const updatedUser = db.findById('users', 'user_id', user.user_id);
    const token = `token_${user.user_id}`;

    return res.status(201).json({
      success: true,
      message: 'Worker onboarding completed successfully!',
      data: {
        token,
        worker,
        user: updatedUser
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateWorkerProfile(req, res, next) {
  try {
    const { id } = req.params;
    const worker = db.findById('workers', 'worker_id', id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: { message: 'Worker not found.' }
      });
    }

    // Role and ownership check (Section 14 & 15)
    const isOwner = req.worker && req.worker.worker_id === id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Unauthorized. You can only modify your own worker profile.' }
      });
    }

    const updates = req.body;
    const allowedFields = [
      'profession',
      'skills',
      'experience',
      'language',
      'languages',
      'location',
      'service_radius',
      'communication_type',
      'daily_rate',
      'status',
      'bio',
      'working_days',
      'pincode',
      'location_name'
    ];

    const cleanUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key];
      }
    }

    // Handle permanent pincode, location, and service radius updates
    const newPincode = (updates.pincode || (updates.location && updates.location.pincode) || worker.pincode || worker.location?.pincode || '462011').toString().trim();
    const newLocationName = (updates.location_name || (updates.location && updates.location.name) || worker.location_name || worker.location?.name || 'Local Area').toString().trim();

    cleanUpdates.pincode = newPincode;
    cleanUpdates.location_name = newLocationName;

    if (updates.service_radius !== undefined) {
      cleanUpdates.service_radius = Math.max(1, Math.min(100, Number(updates.service_radius) || 15));
    }

    let lat = updates.lat || (updates.location && updates.location.lat) || worker.location?.lat;
    let lng = updates.lng || (updates.location && updates.location.lng) || worker.location?.lng;

    // If pincode changed or coords are default, resolve high-accuracy postal coords
    if (updates.pincode || !lat || !lng) {
      try {
        const resolved = await getCoordinatesForPincode(newPincode);
        if (resolved && resolved.lat && resolved.lng) {
          lat = resolved.lat;
          lng = resolved.lng;
        }
      } catch (e) {
        // Fallback to existing coordinates
      }
    }

    cleanUpdates.location = {
      name: newLocationName,
      pincode: newPincode,
      lat: Number(lat) || 23.2332,
      lng: Number(lng) || 77.4343
    };

    cleanUpdates.updated_at = new Date().toISOString();

    db.update('workers', (w) => w.worker_id === id, cleanUpdates);
    const updated = db.findById('workers', 'worker_id', id);

    // Sync permanent pincode and address with user record
    if (worker.user_id) {
      db.update('users', (u) => u.user_id === worker.user_id, {
        pincode: newPincode,
        address: newLocationName,
        updated_at: new Date().toISOString()
      });
    }

    db.addAuditLog({
      actorId: req.user.user_id,
      actorName: req.user.name,
      action: 'WORKER_PROFILE_UPDATED',
      entityType: 'worker',
      entityId: id,
      source: 'web',
      metadata: cleanUpdates
    });

    return res.json({
      success: true,
      message: 'Worker profile and working area updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}
