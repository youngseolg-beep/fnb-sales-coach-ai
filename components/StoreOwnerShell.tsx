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
  return (
    <div className="flex flex-col gap-6">
      {/* 타이틀 영역 */}
      <div className="px-1">
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">매출 입력</h1>
        <p className="mt-1 text-sm text-slate-500">
          날짜를 선택하고 매출 정보를 입력한 뒤 저장하세요.
        </p>
      </div>

      {/* 입력 폼 (DataInput) - 조건문 없이 바로 렌더링하여 멈춤 현상 방지 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
        <DataInput
          selectedDate={selectedDate}
          data={data}
          onDataChange={onDataChange}
          menuMaster={menuMaster}
        />
      </div>

      {/* --- 하단 액션 버튼 영역 (가로형 슬림 배치) --- */}
      <div className="mt-2 flex flex-row items-center justify-center gap-3 px-1">
        {/* 리셋 버튼 */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3.5 text-sm font-bold text-rose-500 transition-all active:scale-95"
        >
          <i className="fa-solid fa-trash-can text-xs"></i>
          <span>리셋</span>
        </button>

        {/* 저장 버튼 (가로로 길게) */}
        <button
          type="button"
          onClick={onSave}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-black text-white shadow-xl transition-all hover:bg-slate-800 active:scale-95"
        >
          <i className="fa-solid fa-cloud-arrow-up"></i>
          <span>매출 데이터 저장하기</span>
        </button>

        {/* 삭제 버튼 (아이콘 전용) */}
        <button
          type="button"
          onClick={onDelete}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
        >
          <i className="fa-solid fa-eraser"></i>
        </button>
      </div>

      {/* 하단 네비게이션 공간 확보용 여백 */}
      <div className="h-20 sm:h-0" />
    </div>
  );
};

export default DailySalesPage;
