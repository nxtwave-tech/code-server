/** IDE drop Python/Jupyter defaults (injected via webClientServer configurationDefaults). */
export const IDE_DEFAULT_PYTHON_INTERPRETER = "/usr/local/bin/python3"

export const IDE_EXCLUDED_PYTHON_KERNEL_PATHS = ["/usr/bin/python3", "/bin/python3"] as const

export function buildIdePythonKernelConfigurationDefaults(openDefaultNotebook: boolean): Record<string, unknown> {
  return {
    "python.defaultInterpreterPath": IDE_DEFAULT_PYTHON_INTERPRETER,
    "jupyter.kernels.excludePythonEnvironments": [...IDE_EXCLUDED_PYTHON_KERNEL_PATHS],
    ...(openDefaultNotebook ? { "workbench.startupEditor": "none" } : {}),
  }
}
