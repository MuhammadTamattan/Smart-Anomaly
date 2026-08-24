const statusConfig = {
  new: { label: 'New' },
  investigating: { label: 'Investigating' },
  resolved: { label: 'Resolved' },
  uploaded: { label: 'Uploaded' },
  processing: { label: 'Processing' },
  completed: { label: 'Completed' },
  analyzed: { label: 'Analyzed' },
  failed: { label: 'Failed' },
  pending: { label: 'Pending' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status };
  return (
    <span className={`ds-badge ds-badge-${status}`}>
      {config.label}
    </span>
  );
}
