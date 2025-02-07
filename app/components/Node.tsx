import { Handle, Position } from "@xyflow/react";

const CustomNode = ({ data }) => {
  return (
    <div className="relative bg-white rounded-lg shadow-lg p-4 border border-gray-200 min-w-[200px]">
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id={"a"}
        style={{
          width: 16,
          height: 16,
          backgroundColor: "#2563EB",
        }}
      />

      {/* Node Content */}
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-800">
            {data.label || "Node Title"}
          </h3>
          {data.status && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              {data.status}
            </span>
          )}
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-sm text-gray-600">{data.description}</p>
        )}

        {/* Details */}
        {data.details && (
          <div className="border-t border-gray-200 pt-2 mt-2">
            <dl className="space-y-1">
              {Object.entries(data.details).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <dt className="text-gray-500">{key}:</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Actions */}
        {data.actions && (
          <div className="flex gap-2 mt-3">
            {data.actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="px-3 py-1 text-sm font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id={"b"}
        style={{
          width: 16,
          height: 16,
          backgroundColor: "#2563EB",
        }}
      />
    </div>
  );
};

export default CustomNode;
