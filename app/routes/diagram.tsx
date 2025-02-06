import React, { useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ControlButton,
  Panel,
} from "@xyflow/react";
import { modals } from "@mantine/modals";

import "~/app.css";
import "@xyflow/react/dist/style.css";
import { ActionIcon, Box, Card, Menu, SimpleGrid } from "@mantine/core";
import { TbPlus } from "react-icons/tb";
import CustomNode from "~/components/Node";
import ArtifactNode from "~/components/nodes/Artifact";

const nodeTypes = {
  custom: CustomNode,
  artifact: ArtifactNode,
};

const initialNodes = [
  {
    id: "1",
    type: "custom",
    position: { x: 250, y: 100 },
    data: {
      label: "Custom Node",
      status: "Active",
      description: "This is a custom node with various features",
      details: {
        Created: "2024-02-06",
        Priority: "High",
        Owner: "John Doe",
      },
      actions: [
        {
          label: "Edit",
          onClick: () => console.log("Edit clicked"),
        },
        {
          label: "Delete",
          onClick: () => console.log("Delete clicked"),
        },
      ],
    },
  },
  {
    id: "2",
    type: "artifact",
    position: { x: 100, y: 100 },
    data: {
      label: "Artifact",
      status: "Pending",
      description: "This is an artifact node with various features",
      details: {
        Created: "2024-02-06",
        Priority: "High",
        Owner: "John Doe",
      },
      actions: [
        {
          label: "Edit",
          onClick: () => console.log("Edit clicked"),
        },
        {
          label: "Delete",
          onClick: () => console.log("Delete clicked"),
        },
      ],
    },
  },
];
const initialEdges = [];

export default function Diagram() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addNode = (type: string) => {
    const id = (nodes.length + 1).toString();
    const newNode = {
      id,
      position: { x: 100, y: 100 },
    };
    setNodes([...nodes, newNode]);
  };

  const openModal = () =>
    modals.openConfirmModal({
      modalId: "add-node",
      title: "Select a node type",
      children: <AddNode addNode={addNode} />,
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onCancel: () => console.log("Cancel"),
      onConfirm: () => console.log("Confirmed"),
    });

  return (
    <Box h={"100%"} w={"100%"}>
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        proOptions={{
          hideAttribution: true,
        }}
        onConnect={onConnect}
      >
        <Panel position={"bottom-right"}>
          <Menu trigger={"hover"}>
            <Menu.Target>
              <ActionIcon size={"xl"} radius={"xl"}>
                <TbPlus />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={openModal}>New Node</Menu.Item>
              <Menu.Item>New Edge</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Panel>
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </Box>
  );
}

const AddNode = ({ addNode }) => {
  return (
    <SimpleGrid cols={2} flex={1}>
      <Card
        withBorder
        onClick={() => {
          addNode("custom");
          modals.close("add-node");
        }}
      >
        Artifact
      </Card>
      <Card withBorder>Node 2</Card>
    </SimpleGrid>
  );
};
