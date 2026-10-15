import { 
  useAlert,
  useConfirm,
  usePopAlert,
  usePrompt
} from '@composables/composables.js';

const { alert } = useAlert();
const { confirm } = useConfirm();
const { showPop } = usePopAlert();
const { prompt } = usePrompt();

/*

Alert: info, success, warning, error

Confirm: info, danger, warning

PopAlert: info, success, warning, error

*/

const handleProjectActions = async () => {
  
  // --- A. ALERT (Single Warning/Notice) ---
  // Used for validation that halts workflow
  const isDuplicate = checkDuplicate(newId);
  if (isDuplicate) {
    await alert({
      title: 'Duplicate ID',
      message: `ID "${newId}" is already in use in this scene.`,
      type: 'warning'
    });
    return resetInput(); // Executed AFTER user clicks OK
  }

  // --- B. PROMPT (User Text Input) ---
  // Used for capturing brief text input
  const newName = await prompt({
    title: 'Rename Project',
    message: 'Enter a new name for this project:',
    defaultValue: 'New Project',
    confirmText: 'Save'
  });

  if (newName !== null && newName.trim() !== '') {
    
    // --- C. CONFIRM (Action Confirmation) ---
    // Used for potentially destructive or irreversible actions
    const isConfirmed = await confirm({
      title: 'Confirm Changes',
      message: `Are you sure you want to rename to "${newName}"?`,
      type: 'info',
      confirmText: 'Yes, Rename'
    });

    if (isConfirmed) {
      try {
        await api.updateProject(newName);

        // --- D. POPALERT (Toast/Popup Notification) ---
        // Non-blocking (no await required)
        showPop({
          title: 'Success!',
          message: 'Project name updated.',
          type: 'success'
        });
      } catch (error) {
        showPop({
          title: 'Failed',
          message: error.message || 'Server error occurred.',
          type: 'error'
        });
      }
    }
  }
};