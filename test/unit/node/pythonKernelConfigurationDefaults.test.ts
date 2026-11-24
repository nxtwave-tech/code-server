import { buildIdePythonKernelConfigurationDefaults } from "../../../src/node/pythonKernelConfigurationDefaults"

describe("pythonKernelConfigurationDefaults", () => {
  it("always applies IDE Python kernel defaults", () => {
    expect(buildIdePythonKernelConfigurationDefaults(false)).toEqual({
      "python.defaultInterpreterPath": "/usr/local/bin/python3",
      "jupyter.kernels.excludePythonEnvironments": ["/usr/bin/python3", "/bin/python3"],
    })
  })

  it("merges startupEditor when opening default notebook", () => {
    expect(buildIdePythonKernelConfigurationDefaults(true)).toEqual({
      "python.defaultInterpreterPath": "/usr/local/bin/python3",
      "jupyter.kernels.excludePythonEnvironments": ["/usr/bin/python3", "/bin/python3"],
      "workbench.startupEditor": "none",
    })
  })
})
