const fs = require("fs");
const path = require("path");

const defaultOptions = { sourcePath: "", targetPath: "", filter: "" };

class FileMoveWebpackPlugin {
  constructor(options) {
    this.options = { ...defaultOptions, ...options };
  }

  apply(compiler) {
    compiler.hooks.done.tap("FileMoveWebpackPlugin", async () => {
      const { sourcePath, targetPath } = this.options;
      const sourceFilestatus = await this.isFileExisted(sourcePath);
      // 判断源路径是否存在，不存在则终止
      if (!sourceFilestatus) {
        console.error("源文件夹不存在，无法移动文件，请检查源路径是否正确");
        return;
      }
      // 判断源路径是否为文件，是文件的话，直接移动
      const sourceStat = fs.lstatSync(sourcePath);
      if (sourceStat.isFile()) {
        const { status: moveStatus, errorMsg: moveErrMsg } = moveFile(
          sourcePath,
          targetPath
        );
        if (!moveStatus) {
          console.error(`${sourcePath}移动失败：${moveErrMsg}`);
        } else {
          console.log(`${sourcePath}移动成功`);
        }
        return;
      }
      // 判断目标文件夹是否存在，不存在则创建
      const targetFilestatus = await this.isFileExisted(targetPath);
      if (!targetFilestatus) {
        console.log("目标文件夹不存在，即将创建...");
        const { status: newFolderStatus, errorMsg: newFolderErrMsg } =
          await this.mkdir(targetPath);
        if (!newFolderStatus) {
          console.error("创建文件夹失败，请重试，错误信息：", newFolderErrMsg);
          return;
        } else {
          console.log("目标文件重建成功");
        }
      }
      // 判断目标文件夹路径是否有效，无效终止
      const targetStat = fs.lstatSync(targetPath);
      if (!targetStat.isDirectory()) {
        console.error("目标路径为无效文件夹路径");
        return;
      }

      const { status: folderMoveStatus, errorMsg: folderMoveErrMsg } =
        await this.moveFolder(sourcePath, targetPath);
      if (!folderMoveStatus) {
        console.error(`文件移动失败：${folderMoveErrMsg}`);
      } else {
        console.log("文件移动成功");
      }
    });
  }

  // 判断文件夹是否存在
  isFileExisted(path) {
    return new Promise((resolve) => {
      fs.access(path, (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  // 创建文件/文件夹
  mkdir(path) {
    return new Promise((resolve) => {
      fs.mkdir(path, (err) => {
        if (err) {
          resolve({ status: false, errorMsg: err });
        } else {
          resolve({ status: true });
        }
      });
    });
  }

  // 移动文件
  moveFile(sourceFilePath, targetFilePath) {
    return new Promise((resolve) => {
      fs.renameSync(sourceFilePath, targetFilePath, (err) => {
        if (err) {
          resolve({ status: false, errorMsg: err });
        } else {
          resolve({ status: true });
        }
      });
    });
  }

  // 移动文件夹
  async moveFolder(sourceFolderPath, targetFolderPath) {
    // 判断目标文件夹是否存在，不存在则创建
    const targetFilestatus = await this.isFileExisted(targetFolderPath);
    if (!targetFilestatus) {
      console.log("目标文件夹不存在，即将创建...");
      const { status: newFolderStatus, errorMsg: newFolderErrMsg } =
        await this.mkdir(targetFolderPath);
      if (!newFolderStatus) {
        console.error("创建文件夹失败，请重试，错误信息：", newFolderErrMsg);
        return;
      } else {
        console.log("目标文件重建成功");
      }
    }

    return new Promise((resolve) => {
      fs.readdir(sourceFolderPath, (err, fileNameList) => {
        if (err) {
          resolve({ status: false, errorMsg: err });
        } else {
          fileNameList.forEach(async (fileName) => {
            if (
              this.options.filter === "" ||
              path.extname(fileName) === this.options.filter
            ) {
              const sourceStat = fs.lstatSync(
                `${sourceFolderPath}/${fileName}`
              );
              if (sourceStat.isFile()) {
                const { status: fileMoveStatus, errorMsg: fileMoveErrMsg } =
                  await this.moveFile(
                    `${sourceFolderPath}/${fileName}`,
                    `${targetFolderPath}/${fileName}`
                  );
                if (!fileMoveStatus) {
                  console.error(
                    `${sourceFolderPath}/${fileName}移动失败：${fileMoveErrMsg}`
                  );
                }
              } else if (sourceStat.isDirectory()) {
                this.moveFolder(
                  `${sourceFolderPath}/${fileName}`,
                  `${targetFolderPath}/${fileName}`
                );
              } else {
                console.error("未知情况，请排查");
              }
            }
          });
          resolve({ status: true });
        }
      });
    });
  }
}

module.exports = FileMoveWebpackPlugin;
