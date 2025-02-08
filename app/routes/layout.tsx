import { NavLink, Outlet } from "react-router";
import { Container, Stack, Title, Text, Group, Box } from "@mantine/core";
import classes from "./Layout.module.css";

const Layout = () => {
  return (
    <Stack h={"100%"} p={"xl"}>
      <Title order={4}>parax</Title>
      <Group>
        <Text component={NavLink} to="/" className={classes.navItem}>
          home
        </Text>
        <Text component={NavLink} to="/paraphrase" className={classes.navItem}>
          paraphrase
        </Text>
        <Text>
          <NavLink to="/multi" className={classes.navItem}>
            llm
          </NavLink>
        </Text>
      </Group>
      <Outlet />
    </Stack>
  );
};

export default Layout;
