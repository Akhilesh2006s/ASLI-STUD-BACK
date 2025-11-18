// Response helper utilities for consistent API responses

export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
};

export const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors
  });
};

export const notFoundResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`
  });
};

export const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    message
  });
};

export const forbiddenResponse = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    message
  });
};

export const conflictResponse = (res, message = 'Conflict') => {
  return res.status(409).json({
    success: false,
    message
  });
};

// Pagination helper
export const paginateResponse = (res, data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return res.json({
    success: true,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
};

// Format user data for response
export const formatUserResponse = (user) => {
  return {
    id: user._id,
    name: user.fullName,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
    details: user.details || '',
    isActive: user.isActive,
    joinDate: user.createdAt,
    lastLogin: user.lastLogin
  };
};

// Format admin data for response
export const formatAdminResponse = (admin) => {
  return {
    id: admin._id,
    name: admin.fullName,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions || [],
    status: admin.isActive ? 'Active' : 'Inactive',
    joinDate: admin.createdAt,
    lastLogin: admin.lastLogin
  };
};

// Format course data for response
export const formatCourseResponse = (course) => {
  return {
    id: course._id,
    title: course.title,
    subject: course.subject,
    grade: course.grade,
    board: course.board,
    teacher: course.teacher?.fullName || 'Unknown',
    description: course.description,
    status: course.isPublished ? 'Published' : 'Draft',
    created: course.createdAt
  };
};

// Format analytics data for response
export const formatAnalyticsResponse = (analytics) => {
  return {
    dailyActive: analytics.dailyActive,
    weeklyActive: analytics.weeklyActive,
    monthlyActive: analytics.monthlyActive,
    avgSessionTime: analytics.avgSessionTime,
    completionRate: analytics.completionRate,
    revenueGrowth: analytics.revenueGrowth,
    userGrowth: analytics.userGrowth,
    courseEngagement: analytics.courseEngagement
  };
};

// Format subscription data for response
export const formatSubscriptionResponse = (subscription) => {
  return {
    id: subscription.id,
    user: subscription.user,
    plan: subscription.plan,
    amount: subscription.amount,
    status: subscription.status,
    nextBilling: subscription.nextBilling,
    paymentMethod: subscription.paymentMethod
  };
};








