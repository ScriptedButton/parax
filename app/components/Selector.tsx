import { SimpleGrid, Card, Title } from "@mantine/core";
import { NavLink } from "react-router";

interface ItemCardProps {
  title: string;
  location: string;
}

const ITEMS: ItemCardProps[] = [
  {
    title: "Paraphrase",
    location: "/paraphrase",
  },
  {
    title: "Multi-Modal",
    location: "/multi",
  },
];

const ItemCard = ({ title, location }: ItemCardProps) => {
  return (
    <Card component={NavLink} to={location} p={"md"} flex={1}>
      <Card.Section p={"sm"}>
        <Title order={4}>{title}</Title>
      </Card.Section>
    </Card>
  );
};

export const Selector = () => {
  return (
    <SimpleGrid cols={2}>
      {ITEMS.map((item) => (
        <ItemCard
          title={item.title}
          location={item.location}
          key={item.title}
        />
      ))}
    </SimpleGrid>
  );
};
