#load "../../../.vscode/examples/template/src/ScriptGlobals.csx"

using System.Threading.Tasks;
using BBT.Workflow.Scripting;
using BBT.Workflow.Definitions;

public class InvalideCacheExecutionMapping : IMapping
{
  public Task<ScriptResponse> InputHandler(WorkflowTask task, ScriptContext context)
  {
    var daprTask = task as DaprServiceTask;
    daprTask.SetMethodName("/api/v1/utilities/invalidate");
    var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

    if (environment == "Development")
    {
      // Local development
      daprTask.SetAppId("vnext-execution-app");
    }
    else
    {
      daprTask.SetAppId($"vnext-vnext-execution.{environment.ToLower()}-vnext-vnext-execution");
    }

    return Task.FromResult(new ScriptResponse
    {
      Data = new
      {
        key = context.Instance.Key,
        flow = context.Workflow.Key,
        domain = context.Runtime.Domain,
        version = context.Instance.LatestData?.Version ?? "1.0.0"
      },
      Headers = null
    });
  }

  public Task<ScriptResponse> OutputHandler(ScriptContext context)
  {
    return Task.FromResult(new ScriptResponse());
  }
}
