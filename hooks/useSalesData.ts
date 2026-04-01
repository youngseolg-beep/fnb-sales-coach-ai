import { useState } from "react";
import { formatLocalDate } from "../utils2/date";
import type { MenuCategory, SalesReportData } from "../types";

const INITIAL_CATEGORIES: MenuCategory[] = [
  {
    name: "음식 메뉴 (Main Dishes)",
    items: [
      { id: "f1", name: "짜장면", price: 7, qty: 0, unitCost: 1.42 },
      { id: "f2", name: "짬뽕", price: 7, qty: 0, unitCost: 2.24 },
      { id: "f3", name: "짬뽕밥", price: 8, qty: 0, unitCost: 2.34 },
      { id: "f4", name: "백짬뽕", price: 7, qty: 0, unitCost: 2.13 },
      { id: "f5", name: "백짬뽕밥", price: 8, qty: 0, unitCost: 2.08 },
      { id: "f6", name: "볶음짬뽕", price: 9, qty: 0, unitCost: 2.94 },
      { id: "f7", name: "고추짜장", price: 9, qty: 0, unitCost: 1.57 },
      { id: "f8", name: "고추짬뽕", price: 10, qty: 0, unitCost: 2.51 },
      { id: "f9", name: "고추짬뽕밥", price: 12, qty: 0, unitCost: 2.61 },
      { id: "f10", name: "짜장밥", price: 5, qty: 0, unitCost: 1.67 },
      { id: "f11", name: "잡채밥", price: 10, qty: 0, unitCost: 3.35 },
      { id: "f12", name: "야채볶음밥", price: 5, qty: 0, unitCost: 1.69 },
      { id: "f13", name: "소고기볶음밥", price: 7, qty: 0, unitCost: 2.36 },
      { id: "f14", name: "마파두부", price: 12, qty: 0, unitCost: 2.24 },
      { id: "f15", name: "마파두부덮밥", price: 9, qty: 0, unitCost: 1.72 },
      { id: "f16", name: "깐풍기", price: 15, qty: 0, unitCost: 2.97 },
      { id: "f17", name: "고추유린기", price: 15, qty: 0, unitCost: 3.71 },
      { id: "f18", name: "쟁반짜장", price: 18, qty: 0, unitCost: 4.38 },
      { id: "f19", name: "돌짜장", price: 18, qty: 0, unitCost: 5.32 },
      { id: "f20", name: "해물육교자", price: 5.5, qty: 0, unitCost: 2.42 },
    ],
  },
  {
    name: "탕수육 (Tangsuyuk)",
    items: [
      { id: "t1", name: "탕수육 S", price: 12, qty: 0, unitCost: 2.7 },
      { id: "t2", name: "탕수육 M", price: 15, qty: 0, unitCost: 3.23 },
      { id: "t3", name: "탕수육 L", price: 18, qty: 0, unitCost: 4.5 },
    ],
  },
  {
    name: "토핑 (Add-ons)",
    items: [
      { id: "a1", name: "토핑 해시브라운", price: 2, qty: 0, unitCost: 0.28 },
      { id: "a2", name: "토핑 계란프라이", price: 1, qty: 0, unitCost: 0.141 },
      { id: "a3", name: "토핑 슬라이스치즈", price: 1, qty: 0, unitCost: 0.29 },
    ],
  },
  {
    name: "음료 및 주류 (Beverages)",
    items: [
      { id: "b1", name: "참이슬 프레쉬 360ml", price: 5, qty: 0 },
      { id: "b2", name: "처음처럼 360ml", price: 5, qty: 0 },
      { id: "b3", name: "진로이즈백 360ml", price: 5, qty: 0 },
      { id: "b4", name: "막걸리", price: 6, qty: 0 },
      { id: "b5", name: "앙코르 맥주 S 330ml", price: 2.5, qty: 0 },
      { id: "b6", name: "앙코르 맥주 L 640ml", price: 4.5, qty: 0 },
      { id: "b7", name: "앙코르 생맥주 250ml", price: 2, qty: 0 },
      { id: "b8", name: "앙코르 생맥주 500ml", price: 3, qty: 0 },
      { id: "b9", name: "하이네켄 생맥주 250ml", price: 2.5, qty: 0 },
      { id: "b10", name: "콜라 330ml", price: 1, qty: 0 },
      { id: "b11", name: "스프라이트 330ml", price: 1, qty: 0 },
      { id: "b12", name: "소다 330ml", price: 1, qty: 0 },
      { id: "b13", name: "봉봉 238ml", price: 2, qty: 0 },
      { id: "b14", name: "쌕쌕 238ml", price: 2, qty: 0 },
      { id: "b15", name: "쿨피스 250ml", price: 2, qty: 0 },
      { id: "b16", name: "밀키스 250ml", price: 2, qty: 0 },
    ],
  },
  {
    name: "고량주 (Liquors)",
    items: [
      { id: "l1", name: "이과두주 100ml", price: 4, qty: 0 },
      { id: "l2", name: "이과두주 500ml", price: 8, qty: 0 },
      { id: "l3", name: "보건주 125ml", price: 6, qty: 0 },
      { id: "l4", name: "보건주 520ml", price: 18, qty: 0 },
      { id: "l5", name: "노주교 500ml", price: 60, qty: 0 },
    ],
  },
];

const cloneCategories = (categories: MenuCategory[]): MenuCategory[] =>
  categories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item })),
  }));

export const useSalesData = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return formatLocalDate(new Date());
  });

  const [data, setData] = useState<SalesReportData>(() => {
    const today = formatLocalDate(new Date());

    return {
      date: today,
      posSales: 0,
      deliverySales: 0,
      orders: 0,
      visitCount: 0,
      toppingQty: 0,
      monthlyTarget: 0,
      menuSales: {},
      categories: cloneCategories(INITIAL_CATEGORIES),
    };
  });

  const [originalCategories, setOriginalCategories] = useState<MenuCategory[]>(() =>
    cloneCategories(INITIAL_CATEGORIES)
  );

  return {
    selectedDate,
    setSelectedDate,
    data,
    setData,
    originalCategories,
    setOriginalCategories,
    initialCategories: INITIAL_CATEGORIES,
    cloneCategories,
  };
};
