import { Dialog, DialogContent } from "@/components/ui/dialog";
import EditTaskForm from "./edit-task-form";
import { TaskType } from "@/types/api.type";

export default function EditTaskDialog(props: {
  task: TaskType;
  projectId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { task, projectId, isOpen, onOpenChange } = props;

  const onClose = () => onOpenChange(false);

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-auto my-5 border-0">
        <EditTaskForm task={task} projectId={projectId} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}