import CreateThreadBox from "../components/threads/CreateThreadBox.jsx";

// Composer page (linked from the sidebar "Create" icon).
const Create = () => (
  <div className="pt-4">
    <h1 className="font-bold text-[17px] px-1 pb-3">Tạo bài viết</h1>
    <CreateThreadBox />
  </div>
);

export default Create;
