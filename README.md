# Create-Disk-Image
Creates a disk image in a few formats, using ImgBurn. (Windows only)
# Example usage
```yaml
name: Create a disk image
on:
  push:
  pull_request:
  workflow_dispatch:
jobs:
 create_iso:
   runs-on: windows-latest
   steps:
    - name: Create .ISO disk image
      uses: Minionguyjpro/Create-Disk-Image@v1
      with:
        path: example
        filename: example.iso
        label: Example Setup
  
```
# Settings
Keys can be added directly to your .yml config file or referenced from your project Secrets storage.

| **Key Name** | **Required** | **Example** | **Default Value** | **Description**                                                                |
|--------------|--------------|-------------|-------------------|--------------------------------------------------------------------------------|
| ``filename`` | Yes          | example.iso | image.iso         | The name of the file when saved to a .ISO or other file                        |
| ``path``     | Yes          | src         | .\                | The path where the files are stored that need to be included in the disk image |
| ``label``    | No           | Example     | N/A               | The label that is used for the disk image in ISO9660 + Joliet format           |
