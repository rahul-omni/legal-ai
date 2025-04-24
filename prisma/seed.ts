import { PermissionName, PrismaClient, RoleName } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Define roles and their default permissions
  const rolesWithPermissions = [
    {
      name: RoleName.ADMIN,
      description: "Administrator role with full access",
      permissions: [
        PermissionName.READ,
        PermissionName.WRITE,
        PermissionName.DELETE,
        PermissionName.SHARE,
        PermissionName.UPLOAD,
        PermissionName.DOWNLOAD,
      ],
    },
    {
      name: RoleName.SUPERVISOR,
      description: "Supervisor role with oversight capabilities",
      permissions: [
        PermissionName.READ,
        PermissionName.SHARE,
        PermissionName.DOWNLOAD,
      ],
    },
    {
      name: RoleName.ASSISTANT,
      description: "Assistant role with limited access",
      permissions: [
        PermissionName.READ,
        PermissionName.UPLOAD,
      ],
    },
  ];

  // Seed roles and permissions
  for (const role of rolesWithPermissions) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
      },
    });
    console.log(`Role created or updated: ${createdRole.name}`);

    // Assign default permissions to the role
    for (const permissionName of role.permissions) {
      await prisma.permission.upsert({
        where: {
          roleId_name_unique: {
            roleId: createdRole.id,
            name: permissionName,
          },
        },
        update: {},
        create: {
          name: permissionName,
          roleId: createdRole.id,
        },
      });
      console.log(
        `Permission ${permissionName} assigned to role ${createdRole.name}`
      );
    }
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
