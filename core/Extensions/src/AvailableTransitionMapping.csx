using System;
using System.Threading.Tasks;
using BBT.Workflow.Scripting;
using BBT.Workflow.Definitions;

namespace BBT.Workflow.Scripting;

public class AvailableTransitionMapping : IMapping
{
  public Task<ScriptResponse> InputHandler(WorkflowTask task, ScriptContext context)
  {
    var daprTask = task as DaprServiceTask;
    var appId = Environment.GetEnvironmentVariable("DAPR_APP_ID");

    daprTask.SetAppId(appId);

    var methodName = daprTask!.MethodName
        .Replace("{domain}", context.Runtime.Domain)
        .Replace("{workflow}", context.Workflow.Key)
        .Replace("{instance}", context.Instance.Key);
    daprTask.SetMethodName(methodName + $"?version={context.Workflow.Version}");
    return Task.FromResult(new ScriptResponse());
  }

  public Task<ScriptResponse> OutputHandler(ScriptContext context)
  {
    return Task.FromResult(new ScriptResponse
    {
      Data = new
      {
        items = context.Body?.data?.items,
        status = context.Body?.data?.status,
        currentState = context.Body?.data?.currentState
      }
    });
  }
}
