import React from "react";
import DataInput from "./DataInput";

// Props 타입 정의
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
  // 에러 방지용 안전 장치: data나 menuMaster가 없을 경우 로딩 표시
  if (!data || !menuMaster) {
    return <div className="p-10 text-center text-slate-400">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 타이틀 영역 */}
      <div className="px-1">
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">매출 입력</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          날짜를 선택하고 매출 정보를 입력한 뒤 저장하세요.
        </p>
      </div>

      {/* 입력 폼 (DataInput) */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <DataInput
          selectedDate={selectedDate}
          data={data}
          onDataChange={onDataChange}
          menuMaster={menuMaster}
        />
      </div>

      {/* --- 하단 액션 버튼 영역 (슬림형 가로 배치) --- */}
      <div className="mt-2 flex flex-row items-center justify-center gap-2 px-1">
        {/* 리셋 버튼 */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-sm font-bold text-rose-500 transition-all active:scale-95"
        >
          <i className="fa-solid fa-trash-can text-[10px]"></i>
          <span className="whitespace-nowrap">리셋</span>
        </button>

        {/* 저장 버튼 (핵심 액션) */}
        <button
          type="button"
          onClick={onSave}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
        >
          <i className="fa-solid fa-cloud-arrow-up"></i>
          <span className="whitespace-nowrap">매출 데이터 저장</span>
        </button>

        {/* 삭제/기타 버튼 (슬림 아이콘 전용) */}
        <button
          type="button"
          onClick={onDelete}
          className="flex h-[48px] w-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all active:scale-95"
        >
          <i className="fa-solid fa-eraser text-xs"></i>
        </button>
      </div>

      {/* 하단 네비게이션 바와의 간섭을 막기 위한 추가 여백 */}
      <div className="h-12 sm:h-0" />
    </div>
  );
};

export default DailySalesPage;
