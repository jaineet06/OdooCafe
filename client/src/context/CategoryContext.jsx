import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import { useAuth } from "./AuthContext";

const CategoryContext = createContext({ categories: [], colorMap: {} });

export function CategoryProvider({ children }) {
  const { isAuthenticated, isKds } = useAuth();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
    staleTime: 60_000,
    enabled: isAuthenticated && !isKds,
  });

  const colorMap = categories.reduce((acc, c) => {
    acc[c.id] = c.color;
    acc[c.name] = c.color;
    return acc;
  }, {});

  return (
    <CategoryContext.Provider value={{ categories, colorMap }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoryContext);
}

export function getCategoryColor(colorMap, categoryId, fallback = "#6B7280") {
  return colorMap[categoryId] || fallback;
}
