import React from "react";
import DataInput from "./DataInput";

// Props 타입 정의 (기존 구조 유지)
interface DailySalesPageProps {
  selectedDate: string;
  data: any;
  onDataChange: (newData: any) => void;
  onSave: () => void;
  onReset: () => void;
  onDelete: () => void;
  menuMaster: any[];
}

const DailySalesPage: React.FC<DailySalesPageProps> = ({
  selectedDate,
  data,
  onDataChange,
  onSave,
  onReset,
  onDelete,
  menuMaster,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 영역 */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">매출 입력</h1>
        <p className="text-sm text-slate-500">
          날짜를 선택하고 매출, 방문객, 주문수, 메뉴 판매 수량을 입력한 뒤 저장하세요.
        </p>
      </div>

      {/* 실제 입력 폼 영역 (DataInput) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
        <DataInput
          selectedDate={selectedDate}
          data={data}
          onDataChange={onDataChange}
          menuMaster={menuMaster}
        />
      </div>

      {/* --- 하단 액션 버튼 영역 (슬림 & 가로 배치) --- */}
      <div className="mt-4 flex flex-row items-center justify-center gap-3">
        {/* 리셋 버튼: 보조 액션으로 슬림하게 구성 */}
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 px-5 py-3.5 text-sm font-bold text-rose-500 transition-all active:scale-95 sm:px-8"
        >
          <i className="fa-solid fa-trash-can text-xs"></i>
          <span className="hidden sm:inline">데이터</span> 리셋
        </button>

        {/* 저장 버튼: 메인 액션으로 강조 (가로로 꽉 차게) */}
        <button
          onClick={onSave}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-black text-white shadow-xl transition-all hover:bg-slate-800 active:scale-95"
        >
          <i className="fa-solid fa-cloud-arrow-up"></i>
          <span>매출 데이터 저장하기</span>
        </button>

        {/* 삭제 버튼 (필요 시 노출, 현재는 아이콘 형태로 슬림하게) */}
        <button
          onClick={onDelete}
          className="flex h-[50px] w-[50px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
          title="삭제"
        >
          <i className="fa-solid fa-eraser"></i>
        </button>
      </div>

      {/* 모바일 하단 여백 가이드 (네비게이션 바와의 거리 확보) */}
      <div className="h-10 sm:hidden" />
    </div>
  );
};

export default DailySalesPage;
