// src/service/workoutService.js
// Service layer for workout and class-related operations

import { classCategories } from '../data/mockData';

// Get all class categories with items
export const getClassCategories = () => {
  return classCategories;
};

// Get a specific class category by id
export const getClassCategoryById = (categoryId) => {
  return classCategories.find(cat => cat.id === categoryId);
};

// Get all classes (flattened from all categories)
export const getAllClasses = () => {
  return classCategories.flatMap(cat => cat.items);
};

// Get a specific class by id
export const getClassById = (classId) => {
  for (const category of classCategories) {
    const classItem = category.items.find(item => item.id === classId);
    if (classItem) {
      return classItem;
    }
  }
  return null;
};

// Search classes by title
export const searchClasses = (query) => {
  const lowerQuery = query.toLowerCase();
  return classCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.title.toLowerCase().includes(lowerQuery)
    )
  })).filter(cat => cat.items.length > 0);
};

// Filter classes by level
export const filterClassesByLevel = (level) => {
  return classCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.level === level)
  })).filter(cat => cat.items.length > 0);
};
