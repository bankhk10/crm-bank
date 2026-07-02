import { StatusBoardTest } from "@/modules/activities-test/features/status-board-test"

export default function StatusTestPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">4. ปฏิทินและสถานะกิจกรรม (My Activities)</h1>
      <StatusBoardTest />
    </div>
  )
}
