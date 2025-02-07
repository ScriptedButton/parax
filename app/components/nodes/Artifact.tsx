import { Handle, Position } from "@xyflow/react";
import { TbFileAnalytics } from "react-icons/tb";
import { Group } from "@mantine/core";

const ArtifactNode = ({ data }) => {
  return (
    <div className="relative bg-white rounded-lg shadow-lg p-4 border border-gray-200 min-w-[200px]">
      {/* Node Content */}
      <div className="space-y-2">
        {/* Header */}
        <Group>
          <TbFileAnalytics className="text-2xl text-gray-800" />
          <h3 className="font-semibold text-lg text-gray-800">
            {data.label || "Node Title"}
          </h3>
        </Group>

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

export default ArtifactNode;
